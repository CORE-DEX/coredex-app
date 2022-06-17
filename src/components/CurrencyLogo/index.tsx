import { Currency } from '@core-dex/sdk'
import { SupportedChainId } from 'constants/chains'
import useHttpLocations from 'hooks/useHttpLocations'
import React, { useMemo } from 'react'
import { useCombinedActiveList } from 'state/lists/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import styled from 'styled-components'

import { isAddress } from '../../utils'
import Logo from '../Logo'

type Network = 'ethereum' | 'polygon'

function chainIdToNetworkName(networkId: SupportedChainId): Network {
  switch (networkId) {
    case SupportedChainId.MAINNET:
      return 'ethereum'
    case SupportedChainId.POLYGON:
      return 'polygon'
    default:
      return 'ethereum'
  }
}

export const getTokenLogoURL = (
  address: string,
  chainId: SupportedChainId = SupportedChainId.MAINNET
): string | void => {
  const networkName = chainIdToNetworkName(chainId)
  const networksWithUrls = [SupportedChainId.MAINNET, SupportedChainId.POLYGON]
  if (networksWithUrls.includes(chainId)) {
    //if (address == CORE_COIN) {
    //  return `https://raw.githubusercontent.com/CORE-DEX/assets/master/blockchains/${networkName}/assets/${address}/logo.png`
    //} else {}
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${networkName}/assets/${address}/logo.png`
  }
}

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  background-color: ${({ theme }) => theme.white};
  color: ${({ theme }) => theme.text4};
`

export default function CurrencyLogo({
  currency,
  address,
  size = '24px',
  style,
  ...rest
}: {
  currency?: Currency | null
  address?: string
  size?: string
  style?: React.CSSProperties
}) {
  const polygon = useCombinedActiveList()?.[137]

  const checkSummed = isAddress(address)

  const polygonURI = useMemo(() => {
    if (checkSummed && polygon?.[checkSummed]) {
      return polygon?.[checkSummed].token.logoURI
    }
    return undefined
  }, [checkSummed, polygon])
  const uriLocationsPolygon = useHttpLocations(polygonURI)
  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  //temp until token logo issue merged
  const tempSources: { [address: string]: string } = useMemo(() => {
    return {
      ['0x4dd28568d05f09b02220b09c2cb307bfd837cb95']:
        'https://assets.coingecko.com/coins/images/18143/thumb/wCPb0b88_400x400.png?1630667954',
    }
  }, [])

  const srcs: string[] = useMemo(() => {
    const checkSummed = isAddress(address)

    if (checkSummed && address) {
      const override = tempSources[address]
      return [getTokenLogoURL(checkSummed, currency?.chainId) ?? '', ...uriLocationsPolygon, override]
    }

    if (!currency || currency.isNative) return []

    if (currency.isToken) {
      const defaultUrls = []
      const url = getTokenLogoURL(currency.address, currency.chainId)
      if (url) {
        defaultUrls.push(url)
      }
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, ...defaultUrls]
      }
      return defaultUrls
    }
    return []
  }, [address, currency, tempSources, uriLocations, uriLocationsPolygon])

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />
}
