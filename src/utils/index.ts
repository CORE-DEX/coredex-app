import { abi as ICoreDexRouter02ABI } from '@core-dex/periphery/build/ICoreDexRouter02.json'
import { Currency, CurrencyAmount, Fraction, Percent, Token } from '@core-dex/sdk'
import { getAddress } from '@ethersproject/address'
import { BigNumber } from '@ethersproject/bignumber'
import { AddressZero } from '@ethersproject/constants'
import { Contract } from '@ethersproject/contracts'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { ROUTER_ADDRESS } from 'constants/addresses'
import { SupportedChainId } from 'constants/chains'
import JSBI from 'jsbi'
import { ChainTokenMap } from 'state/lists/hooks'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

const ETHERSCAN_PREFIXES: { [chainId: number]: string } = {
  [SupportedChainId.MAINNET]: '',
  [SupportedChainId.GOERLI]: 'goerli.',
}

export function getEtherscanLink(
  chainId: number | undefined,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string {
  const prefix =
    chainId === SupportedChainId.POLYGON
      ? 'https://polygonscan.com/'
      : chainId === SupportedChainId.MUMBAI
      ? 'https://mumbai.polygonscan.com/'
      : `https://${ETHERSCAN_PREFIXES[chainId ?? -1] || ETHERSCAN_PREFIXES[1]}etherscan.io`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      return `${prefix}/token/${data}`
    }
    case 'block': {
      return `${prefix}/block/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

export const currentTimestamp = () => new Date().getTime()

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 10%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000))
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(num), JSBI.BigInt(10000))
}

const ONE = new Fraction(1, 1)
export function calculateSlippageAmount(value: CurrencyAmount<Currency>, slippage: Percent): [JSBI, JSBI] {
  if (slippage.lessThan(0) || slippage.greaterThan(ONE)) throw new Error('Unexpected slippage')
  return [value.multiply(ONE.subtract(slippage)).quotient, value.multiply(ONE.add(slippage)).quotient]
}
// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

// account is optional
export function getRouterContract(_: number, library: Web3Provider, chainId: number, account?: string): Contract {
  return getContract(ROUTER_ADDRESS[chainId], ICoreDexRouter02ABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(tokenAddressMap: ChainTokenMap, token?: Token): boolean {
  return Boolean(token?.isToken && tokenAddressMap[token.chainId]?.[token.address])
}

export function feeTierPercent(fee: number): string {
  return (fee / 10000).toPrecision(1) + '%'
}

export function notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
  return value !== null && value !== undefined
}
