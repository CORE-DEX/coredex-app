import { Currency } from '@cocore/swap-sdk'
import { SupportedChainId } from 'constants/chains'
import { nativeOnChain } from 'constants/tokens'
import { useMemo } from 'react'

import { useActiveWeb3React } from './web3'

export default function useNativeCurrency(): Currency {
  const { chainId } = useActiveWeb3React()
  return useMemo(
    () =>
      chainId
        ? nativeOnChain(chainId)
        : // display mainnet when not connected
          nativeOnChain(SupportedChainId.MAINNET),
    [chainId]
  )
}
