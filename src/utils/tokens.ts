import { Token } from '@cocore/swap-sdk'
import { SupportedChainId } from 'constants/chains'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'

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

export function formatTokenSymbol(address: string, symbol: string, activeNetwork: number | undefined) {
  // dumb catch for matic
  if (
    address === WRAPPED_NATIVE_CURRENCY[activeNetwork ?? -1].address &&
    (activeNetwork === SupportedChainId.POLYGON || activeNetwork === SupportedChainId.MUMBAI)
  ) {
    return 'MATIC'
  }

  if (WRAPPED_NATIVE_CURRENCY[activeNetwork ?? -1].address.includes(address)) {
    return 'ETH'
  }

  return symbol
}

export function formatTokenName(address: string, name: string, activeNetwork: number | undefined) {
  // dumb catch for matic
  if (
    address === WRAPPED_NATIVE_CURRENCY[activeNetwork ?? -1].address &&
    (activeNetwork === SupportedChainId.POLYGON || activeNetwork === SupportedChainId.MUMBAI)
  ) {
    return 'MATIC'
  }

  if (WRAPPED_NATIVE_CURRENCY[activeNetwork ?? -1].address.includes(address)) {
    return 'Ether'
  }

  return name
}
