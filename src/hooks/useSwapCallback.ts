import { Currency, Percent, Router, Trade, TradeType } from '@cocore/swap-sdk'
import { BigNumber } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import isZero from 'utils/isZero'

import { isAddress, shortenAddress } from '../utils'
import { calculateGasMargin } from '../utils/calculateGasMargin'
import { useRouterContract } from './useContract'
import useENS from './useENS'
import useTransactionDeadline from './useTransactionDeadline'
import { useActiveWeb3React } from './web3'

enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

interface SwapCall {
  address: string
  calldata: string
  value: string
}

interface SwapCallEstimate {
  call: SwapCall
}

interface SuccessfulCall extends SwapCallEstimate {
  call: SwapCall
  gasEstimate: BigNumber
}

interface FailedCall extends SwapCallEstimate {
  call: SwapCall
  error: Error
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName the ENS name or address of the recipient of the swap output
 * @param signatureData the signature data of the permit of the input token amount, if available
 */
function useSwapCallArguments(
  trade: Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const deadline = useTransactionDeadline()
  const routerContract = useRouterContract()

  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !chainId || !deadline) return []

    if (!routerContract) return []
    const swapMethods = []

    swapMethods.push(
      Router.swapCallParameters(trade, {
        feeOnTransfer: false,
        allowedSlippage,
        recipient,
        deadline: deadline.toNumber(),
      })
    )

    if (trade.tradeType === TradeType.EXACT_INPUT) {
      swapMethods.push(
        Router.swapCallParameters(trade, {
          feeOnTransfer: true,
          allowedSlippage,
          recipient,
          deadline: deadline.toNumber(),
        })
      )
    }
    return swapMethods.map(({ methodName, args, value }) => {
      return {
        address: routerContract.address,
        calldata: routerContract.interface.encodeFunctionData(methodName, args),
        value,
      }
    })
  }, [account, allowedSlippage, chainId, deadline, library, recipient, routerContract, trade])
}

/**
 * This is hacking out the revert reason from the ethers provider thrown error however it can.
 * This object seems to be undocumented by ethers.
 * @param error an error from the ethers provider
 */
function swapErrorToUserReadableMessage(error: any): string {
  let reason: string | undefined
  while (Boolean(error)) {
    reason = error.reason ?? error.message ?? reason
    error = error.error ?? error.data?.originalError
  }

  if (reason?.indexOf('execution reverted: ') === 0) reason = reason.substr('execution reverted: '.length)

  switch (reason) {
    case 'CocoreswapRouter: EXPIRED':
      return `The transaction could not be sent because the deadline has passed. Please check that your transaction deadline is not too low.`
    case 'CocoreswapRouter: INSUFFICIENT_OUTPUT_AMOUNT':
    case 'CocoreswapRouter: EXCESSIVE_INPUT_AMOUNT':
      return `This transaction will not succeed either due to price movement or fee on transfer. Try increasing your slippage tolerance.`
    case 'TransferHelper: TRANSFER_FROM_FAILED':
      return `The input token cannot be transferred. There may be an issue with the input token.`
    case 'CocoreSwap: TRANSFER_FAILED':
      return `The output token cannot be transferred. There may be an issue with the output token.`
    case 'CocoreSwap: K':
      return `The CocoreSwap invariant x*y=k was not satisfied by the swap. This usually means one of the tokens you are swapping incorporates custom behavior on transfer.`
    case 'Too little received':
    case 'Too much requested':
    case 'STF':
      return `This transaction will not succeed due to price movement. Try increasing your slippage tolerance.`
    case 'TF':
      return `The output token cannot be transferred. There may be an issue with the output token.`
    default:
      if (reason?.indexOf('undefined is not an object') !== -1) {
        console.error(error, reason)
        return `An error occurred when trying to execute this swap. You may need to increase your slippage tolerance. If that does not work, there may be an incompatibility with the token you are trading.`
      }
      return `Unknown error${reason ? `: "${reason}"` : ''}. Try increasing your slippage tolerance. `
  }
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  trade: Trade<Currency, Currency, TradeType> | undefined, // trade to execute, required
  allowedSlippage: Percent, // in bips
  recipientAddressOrName: string | null // the ENS name or address of the recipient of the trade, or null if swap should be returned to sender
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, library } = useActiveWeb3React()

  const swapCalls = useSwapCallArguments(trade, allowedSlippage, recipientAddressOrName)

  const addTransaction = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(() => {
    if (!trade || !library || !account || !chainId) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }
    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    return {
      state: SwapCallbackState.VALID,
      callback: async function onSwap(): Promise<string> {
        const estimatedCalls: SwapCallEstimate[] = await Promise.all(
          swapCalls.map((call) => {
            const { address, calldata, value } = call

            const tx =
              !value || isZero(value)
                ? { from: account, to: address, data: calldata }
                : {
                    from: account,
                    to: address,
                    data: calldata,
                    value,
                  }

            return library
              .estimateGas(tx)
              .then((gasEstimate) => {
                return {
                  call,
                  gasEstimate,
                }
              })
              .catch((gasError) => {
                console.debug('Gas estimate failed, trying eth_call to extract error', call)

                return library
                  .call(tx)
                  .then((result) => {
                    console.debug('Unexpected successful call after failed estimate gas', call, gasError, result)
                    return { call, error: new Error('Unexpected issue with estimating the gas. Please try again.') }
                  })
                  .catch((callError) => {
                    console.debug('Call threw error', call, callError)
                    return { call, error: new Error(swapErrorToUserReadableMessage(callError)) }
                  })
              })
          })
        )

        // a successful estimation is a bignumber gas estimate and the next call is also a bignumber gas estimate
        let bestCallOption: SuccessfulCall | SwapCallEstimate | undefined = estimatedCalls.find(
          (el, ix, list): el is SuccessfulCall =>
            'gasEstimate' in el && (ix === list.length - 1 || 'gasEstimate' in list[ix + 1])
        )

        // check if any calls errored with a recognizable error
        if (!bestCallOption) {
          const errorCalls = estimatedCalls.filter((call): call is FailedCall => 'error' in call)
          if (errorCalls.length > 0) throw errorCalls[errorCalls.length - 1].error
          const firstNoErrorCall = estimatedCalls.find<SwapCallEstimate>(
            (call): call is SwapCallEstimate => !('error' in call)
          )
          if (!firstNoErrorCall) throw new Error('Unexpected error. Could not estimate gas for the swap.')
          bestCallOption = firstNoErrorCall
        }

        const {
          call: { address, calldata, value },
        } = bestCallOption

        return library
          .getSigner()
          .sendTransaction({
            from: account,
            to: address,
            data: calldata,
            // let the wallet try if we can't estimate the gas
            ...('gasEstimate' in bestCallOption ? { gasLimit: calculateGasMargin(bestCallOption.gasEstimate) } : {}),
            ...(value && !isZero(value) ? { value } : {}),
          })
          .then((response) => {
            const inputSymbol = trade.inputAmount.currency.symbol
            const outputSymbol = trade.outputAmount.currency.symbol
            const inputAmount = trade.inputAmount.toSignificant(4)
            const outputAmount = trade.outputAmount.toSignificant(4)

            const base = `Swap ${inputAmount} ${inputSymbol} for ${outputAmount} ${outputSymbol}`
            const withRecipient =
              recipient === account
                ? base
                : `${base} to ${
                    recipientAddressOrName && isAddress(recipientAddressOrName)
                      ? shortenAddress(recipientAddressOrName)
                      : recipientAddressOrName
                  }`

            addTransaction(response, {
              summary: withRecipient,
            })

            return response.hash
          })
          .catch((error) => {
            if (error?.code === 4001) {
              throw new Error('Transaction rejected.')
            } else {
              console.error(`Swap failed`, error, address, calldata, value)

              throw new Error(`Swap failed: ${swapErrorToUserReadableMessage(error)}`)
            }
          })
      },
      error: null,
    }
  }, [trade, library, account, chainId, recipient, recipientAddressOrName, swapCalls, addTransaction])
}
