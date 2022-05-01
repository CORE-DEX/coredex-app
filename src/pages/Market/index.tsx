import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import PoolTable from 'components/pools/PoolTable'
import { ResponsiveRow } from 'components/Row'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle'
import TokenTable from 'components/tokens/TokenTable'
import TopTokenMovers from 'components/tokens/TopTokenMovers'
import { CHAIN_INFO } from 'constants/chainInfo'
//import useWindowOnResize from 'hooks/useWindowOnResize'
import { useActiveWeb3React } from 'hooks/web3'
import React, { useEffect, useMemo, useState } from 'react'
import { useAllPoolData, usePoolDatas } from 'state/pools/hooks'
import { useAllTokenData, useTokenDatas } from 'state/tokens/hooks'
import { useSavedTokens } from 'state/user/hooks'
import { useSavedPools } from 'state/user/hooks'
import styled from 'styled-components'

import { HideSmall, TYPE } from '../../theme'
import { notEmpty } from '../../utils'
import { PageWrapper } from '../styled'

const ListWrapper = styled.div<{ scrollColor?: string }>`
  height: 60vh;
  overflow-y: auto;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: auto;
  `};

  ::-webkit-scrollbar {
    width: 5px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.bg2};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ scrollColor }) => (scrollColor ? scrollColor : '#00cc227a')};
    opacity: 0.5;
  }
`

const MarketWrapper = styled.div<{ marginRight?: string; marginLeft?: string }>`
  width: 50%;
  margin-right: ${({ marginRight }) => (marginRight ? marginRight : '0')};
  margin-left: ${({ marginLeft }) => (marginLeft ? marginLeft : '0')};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    margin-right: 0;
    margin-left: 0;
    margin-bottom: 2.5vh;
  `};
`

export default function TokensOverview() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const allTokens = useAllTokenData()
  const allPoolData = useAllPoolData()

  const formattedTokens = useMemo(() => {
    return Object.values(allTokens)
      .map((t) => t.data)
      .filter(notEmpty)
  }, [allTokens])
  const poolDatas = useMemo(() => {
    return Object.values(allPoolData)
      .map((p) => p.data)
      .filter(notEmpty)
  }, [allPoolData])

  const [savedTokens] = useSavedTokens()
  const [savedPools] = useSavedPools()
  const watchListTokens = useTokenDatas(savedTokens)
  const watchListPools = usePoolDatas(savedPools)

  const [viewWatchListTokens, setViewWatchListTokens] = useState(false)
  const [viewWatchListPools, setViewWatchListPools] = useState(false)

  const { chainId } = useActiveWeb3React()
  const activeNetwork = CHAIN_INFO[chainId ?? -1]

  //const { maxItems } = useWindowOnResize()

  return (
    <PageWrapper color={activeNetwork.scrollColor}>
      <AutoColumn gap="20px">
        <HideSmall>
          <DarkGreyCard style={{ paddingTop: '12px' }}>
            <AutoColumn gap="md">
              <TYPE.mediumHeader fontSize="16px">Top Movers</TYPE.mediumHeader>
              <TopTokenMovers />
            </AutoColumn>
          </DarkGreyCard>
        </HideSmall>
        <ResponsiveRow align="flex-start">
          <MarketWrapper marginRight="10px">
            <ToggleWrapper width="100%" marginBottom="5px">
              <ToggleElementFree
                isActive={!viewWatchListTokens}
                fontSize="16px"
                onClick={() => (!viewWatchListTokens ? setViewWatchListTokens(true) : setViewWatchListTokens(false))}
              >
                All Tokens
              </ToggleElementFree>
              <ToggleElementFree
                isActive={viewWatchListTokens}
                fontSize="16px"
                onClick={() => (viewWatchListTokens ? setViewWatchListTokens(false) : setViewWatchListTokens(true))}
              >
                Tokens Watchlist
              </ToggleElementFree>
            </ToggleWrapper>
            <ListWrapper scrollColor={activeNetwork.scrollColor}>
              {viewWatchListTokens ? (
                savedTokens.length > 0 ? (
                  <TokenTable tokenDatas={watchListTokens} />
                ) : (
                  <DarkGreyCard>
                    <TYPE.main>Saved tokens will appear here</TYPE.main>
                  </DarkGreyCard>
                )
              ) : (
                <TokenTable tokenDatas={formattedTokens} />
              )}
            </ListWrapper>
          </MarketWrapper>
          <MarketWrapper marginLeft="10px">
            <ToggleWrapper width="100%" marginBottom="5px">
              <ToggleElementFree
                isActive={!viewWatchListPools}
                fontSize="16px"
                onClick={() => (!viewWatchListPools ? setViewWatchListPools(true) : setViewWatchListPools(false))}
              >
                All Pools
              </ToggleElementFree>
              <ToggleElementFree
                isActive={viewWatchListPools}
                fontSize="16px"
                onClick={() => (viewWatchListPools ? setViewWatchListPools(false) : setViewWatchListPools(true))}
              >
                Pools Watchlist
              </ToggleElementFree>
            </ToggleWrapper>
            <ListWrapper scrollColor={activeNetwork.scrollColor}>
              {viewWatchListPools ? (
                savedPools.length > 0 ? (
                  <PoolTable poolDatas={watchListPools} />
                ) : (
                  <DarkGreyCard>
                    <TYPE.main>Saved pools will appear here</TYPE.main>
                  </DarkGreyCard>
                )
              ) : (
                <PoolTable poolDatas={poolDatas} />
              )}
            </ListWrapper>
          </MarketWrapper>
        </ResponsiveRow>
      </AutoColumn>
    </PageWrapper>
  )
}
