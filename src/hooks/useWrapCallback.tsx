import { Currency } from '@core-dex/sdk'
import { SupportedChainId } from 'constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import React, { useMemo } from 'react'
import { Text } from 'rebass'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'

import { useWETHContract } from './useContract'
import useNativeCurrency from './useNativeCurrency'
import { useActiveWeb3React } from './web3'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }

enum WrapInputError {
  NO_ERROR, // must be equal to 0 so all other errors are truthy
  ENTER_NATIVE_AMOUNT,
  ENTER_WRAPPED_AMOUNT,
  INSUFFICIENT_NATIVE_BALANCE,
  INSUFFICIENT_WRAPPED_BALANCE,
}

export function WrapErrorText({ wrapInputError }: { wrapInputError: WrapInputError }) {
  const native = useNativeCurrency()
  const wrapped = native?.wrapped

  switch (wrapInputError) {
    case WrapInputError.NO_ERROR:
      return null
    case WrapInputError.ENTER_NATIVE_AMOUNT:
      return <Text>Enter {native?.symbol} amount</Text>
    case WrapInputError.ENTER_WRAPPED_AMOUNT:
      return <Text>Enter {wrapped?.symbol} amount</Text>

    case WrapInputError.INSUFFICIENT_NATIVE_BALANCE:
      return <Text>Insufficient {native?.symbol} balance</Text>
    case WrapInputError.INSUFFICIENT_WRAPPED_BALANCE:
      return <Text>Insufficient {wrapped?.symbol} balance</Text>
  }
}

/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined | null,
  outputCurrency: Currency | undefined | null,
  typedValue: string | undefined
): { wrapType: WrapType; execute?: undefined | (() => Promise<void>); inputError?: WrapInputError } {
  const { chainId, account } = useActiveWeb3React()
  const wethContract = useWETHContract()
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency ?? undefined)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency ?? undefined), [inputCurrency, typedValue])
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!wethContract || !chainId || !inputCurrency || !outputCurrency) return NOT_APPLICABLE
    const weth = WRAPPED_NATIVE_CURRENCY[chainId]
    if (!weth) return NOT_APPLICABLE

    const hasInputAmount = Boolean(inputAmount?.greaterThan('0'))
    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    if (inputCurrency.isNative && weth.equals(outputCurrency)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await wethContract.deposit({ value: `0x${inputAmount.quotient.toString(16)}` })
                  if (chainId == SupportedChainId.POLYGON || chainId == SupportedChainId.MUMBAI) {
                    addTransaction(txReceipt, {
                      summary: `Wrap ${inputAmount.toSignificant(6)} MATIC to WMATIC`,
                    })
                  } else {
                    addTransaction(txReceipt, {
                      summary: `Wrap ${inputAmount.toSignificant(6)} ETH to WETH`,
                    })
                  }
                } catch (error) {
                  console.error('Could not deposit', error)
                }
              }
            : undefined,
        inputError: sufficientBalance
          ? undefined
          : hasInputAmount
          ? WrapInputError.INSUFFICIENT_NATIVE_BALANCE
          : WrapInputError.ENTER_NATIVE_AMOUNT,
      }
    } else if (weth.equals(inputCurrency) && outputCurrency.isNative) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  const txReceipt = await wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`)
                  if (chainId == SupportedChainId.POLYGON || chainId == SupportedChainId.MUMBAI) {
                    addTransaction(txReceipt, {
                      summary: `Unwrap ${inputAmount.toSignificant(6)} WMATIC to MATIC`,
                    })
                  } else {
                    addTransaction(txReceipt, {
                      summary: `Unwrap ${inputAmount.toSignificant(6)} WETH to ETH`,
                    })
                  }
                } catch (error) {
                  console.error('Could not withdraw', error)
                }
              }
            : undefined,
        inputError: sufficientBalance
          ? undefined
          : hasInputAmount
          ? WrapInputError.INSUFFICIENT_WRAPPED_BALANCE
          : WrapInputError.ENTER_WRAPPED_AMOUNT,
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [wethContract, chainId, inputCurrency, outputCurrency, inputAmount, balance, addTransaction])
}
