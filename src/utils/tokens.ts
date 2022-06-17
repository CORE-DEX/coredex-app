import { Token } from '@core-dex/sdk'
import { SupportedChainId } from 'constants/chains'
import { WETH_MUMBAI, WETH_POLYGON, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'

export interface SerializedToken {
  chainId: number
  address: string
  decimals: number
  symbol?: string
  name?: string
}

export function serializeToken(token: Token): SerializedToken {
  return {
    chainId: token.chainId,
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name,
  }
}

export function deserializeToken(serializedToken: SerializedToken): Token {
  return new Token(
    serializedToken.chainId,
    serializedToken.address,
    serializedToken.decimals,
    serializedToken.symbol,
    serializedToken.name
  )
}

export function formatTokenSymbol(address: string, symbol: string, chainId: number | undefined) {
  // dumb catch for matic
  if (
    address === WRAPPED_NATIVE_CURRENCY[chainId ?? -1].address.toLowerCase() &&
    (chainId === SupportedChainId.POLYGON || chainId === SupportedChainId.MUMBAI)
  ) {
    return 'MATIC'
  }

  if (
    WRAPPED_NATIVE_CURRENCY[chainId ?? -1].address.toLowerCase().includes(address) ||
    address === WETH_POLYGON.address.toLowerCase() ||
    address === WETH_MUMBAI.address.toLowerCase()
  ) {
    return 'ETH'
  }

  return symbol
}

export function formatTokenName(address: string, name: string, chainId: number | undefined) {
  // dumb catch for matic
  if (
    address === WRAPPED_NATIVE_CURRENCY[chainId ?? -1].address.toLowerCase() &&
    (chainId === SupportedChainId.POLYGON || chainId === SupportedChainId.MUMBAI)
  ) {
    return 'MATIC'
  }

  if (
    WRAPPED_NATIVE_CURRENCY[chainId ?? -1].address.toLowerCase().includes(address) ||
    address === WETH_POLYGON.address.toLowerCase() ||
    address === WETH_MUMBAI.address.toLowerCase()
  ) {
    return 'Ether'
  }

  return name
}
