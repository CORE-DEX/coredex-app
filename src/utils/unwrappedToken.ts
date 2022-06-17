import { Currency } from '@core-dex/sdk'
import { nativeOnChain, WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'

import { supportedChainId } from './supportedChainId'

export function unwrappedToken(currency: Currency): Currency {
  if (currency.isNative) return currency
  const formattedChainId = supportedChainId(currency.chainId)
  if (formattedChainId && currency.equals(WRAPPED_NATIVE_CURRENCY[formattedChainId]))
    return nativeOnChain(formattedChainId)
  return currency
}
