import { Currency, Token } from '@cocore/swap-sdk'
import { useMemo } from 'react'

import { useUnsupportedTokens } from './Tokens'

/**
 * Returns true if the input currency or output currency cannot be traded in the interface
 * @param currencyIn the input currency to check
 * @param currencyOut the output currency to check
 */
export function useIsSwapUnsupported(currencyIn?: Currency, currencyOut?: Currency): boolean {
  const unsupportedTokens: { [address: string]: Token } = useUnsupportedTokens()

  return useMemo(() => {
    if (!unsupportedTokens) {
      return false
    }
    const currencyInUnsupported = Boolean(currencyIn?.isToken && unsupportedTokens[currencyIn.address])
    const currencyOutUnsupported = Boolean(currencyOut?.isToken && unsupportedTokens[currencyOut.address])
    return currencyInUnsupported || currencyOutUnsupported
  }, [currencyIn, currencyOut, unsupportedTokens])
}
