import BarChart from 'components/BarChart/alt'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import LineChart from 'components/LineChart/alt'
import { LoadingRows } from 'components/Loader'
import Percent from 'components/Percent'
import PoolTable from 'components/pools/PoolTable'
import { AutoRow, ResponsiveRow, RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import TokenTable from 'components/tokens/TokenTable'
import TransactionsTable from 'components/TransactionsTable'
import { CHAIN_INFO } from 'constants/chainInfo'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks/web3'
import React, { useEffect, useMemo, useState } from 'react'
import { useAllPoolData } from 'state/pools/hooks'
import {
  useAggregateOverviewData,
  useProtocolChartData,
  useProtocolData,
  useProtocolTransactions,
} from 'state/protocol/hooks'
import { useAllTokenData } from 'state/tokens/hooks'
import { TokenData } from 'state/tokens/reducer'
import styled from 'styled-components'
import { HideMedium, StyledInternalLink } from 'theme/components'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'

import { TYPE } from '../../theme'
import { notEmpty } from '../../utils'
import { PageWrapper } from '../styled'

const ChartWrapper = styled.div`
  flex-direction: column;
  width: 50%;
  height: 80vh;

  @media (max-height: 950px) {
    height: 715px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    margin-bottom: 2.5vh;
  `};
`

const TopWrapper = styled.div<{ scrollColor?: string }>`
  width: 50%;
  height: 80vh;
  margin-left: 20px;
  overflow-y: auto;

  @media (max-height: 950px) {
    height: 715px;
  }

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

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    height: auto;
    padding-right: 0;
    padding-bottom: 1vh;
    margin-left: 0;
  `};
`

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const theme = useTheme()

  useAggregateOverviewData()

  const { chainId } = useActiveWeb3React()
  const activeNetwork = CHAIN_INFO[chainId ?? -1]

  const [protocolData] = useProtocolData()
  const [chartData] = useProtocolChartData()
  const [transactions] = useProtocolTransactions()

  const [volumeHover, setVolumeHover] = useState<number | undefined>()
  const [liquidityHover, setLiquidityHover] = useState<number | undefined>()
  const [leftLabel, setLeftLabel] = useState<string | undefined>()
  const [rightLabel, setRightLabel] = useState<string | undefined>()

  useEffect(() => {
    setLiquidityHover(undefined)
    setVolumeHover(undefined)
  }, [chainId])

  // get all the pool datas that exist
  const allPoolData = useAllPoolData()
  const poolDatas = useMemo(() => {
    return Object.values(allPoolData)
      .map((p) => p.data)
      .filter(notEmpty)
  }, [allPoolData])

  // if hover value undefined, reset to current day value
  useEffect(() => {
    if (volumeHover === undefined && protocolData) {
      setVolumeHover(protocolData.volumeUSD)
    }
  }, [protocolData, volumeHover])
  useEffect(() => {
    if (liquidityHover === undefined && protocolData) {
      setLiquidityHover(protocolData.tvlUSD)
    }
  }, [liquidityHover, protocolData])

  const formattedTvlData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.tvlUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const formattedVolumeData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.volumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const allTokens = useAllTokenData()

  const formattedTokens = useMemo(() => {
    return Object.keys(allTokens).reduce((accum: TokenData[], key) => {
      const tokenData = allTokens[key]
      if (tokenData && tokenData.data && tokenData.data?.exists === true) {
        accum.push(tokenData.data)
      }
      return accum
    }, [])
  }, [allTokens])

  return (
    <PageWrapper>
      {/* <ThemedBackgroundGlobal backgroundColor={activeNetwork.bgColor} /> */}
      <AutoColumn gap="15px">
        <TYPE.main>Cocoreswap Overview</TYPE.main>
        <ResponsiveRow>
          <ChartWrapper>
            <LineChart
              data={formattedTvlData}
              color={activeNetwork.primaryColor}
              value={liquidityHover}
              label={leftLabel}
              setValue={setLiquidityHover}
              setLabel={setLeftLabel}
              topLeft={
                <AutoRow justify="space-between">
                  <TYPE.mediumHeader fontSize="16px">TVL</TYPE.mediumHeader>
                  <AutoColumn justify="end">
                    <TYPE.largeHeader fontSize="32px">
                      <MonoSpace>{formatDollarAmount(liquidityHover, 2, true)} </MonoSpace>
                    </TYPE.largeHeader>
                    <TYPE.main fontSize="12px" height="14px">
                      {leftLabel ? <MonoSpace>{leftLabel} (UTC)</MonoSpace> : null}
                    </TYPE.main>
                  </AutoColumn>
                </AutoRow>
              }
              chartDisplay="overview"
              marginBottom="20px"
            />
            <BarChart
              data={formattedVolumeData}
              color={theme.blue1}
              setValue={setVolumeHover}
              setLabel={setRightLabel}
              value={volumeHover}
              label={rightLabel}
              topLeft={
                <AutoRow justify="space-between">
                  <TYPE.mediumHeader fontSize="16px" paddingRight="3vw">
                    Volume 24H
                  </TYPE.mediumHeader>
                  <AutoColumn justify="end">
                    <TYPE.largeHeader fontSize="32px">
                      <MonoSpace> {formatDollarAmount(volumeHover, 2)}</MonoSpace>
                    </TYPE.largeHeader>
                    <TYPE.main fontSize="12px" height="14px">
                      {rightLabel ? <MonoSpace>{rightLabel} (UTC)</MonoSpace> : null}
                    </TYPE.main>
                  </AutoColumn>
                </AutoRow>
              }
              chartDisplay="overview"
              marginBottom="20px"
            />
            <DarkGreyCard padding="10px">
              <RowBetween>
                <RowFixed mr="20px">
                  <TYPE.main mr="4px">Volume 24H: </TYPE.main>
                  <TYPE.label mr="4px">{formatDollarAmount(protocolData?.volumeUSD)}</TYPE.label>
                  <Percent value={protocolData?.volumeUSDChange} wrap={true} />
                </RowFixed>
                <RowFixed mr="20px">
                  <TYPE.main mr="4px">Fees 24H: </TYPE.main>
                  <TYPE.label mr="4px">{formatDollarAmount(protocolData?.feesUSD)}</TYPE.label>
                  <Percent value={protocolData?.feeChange} wrap={true} />
                </RowFixed>
                <HideMedium>
                  <RowFixed mr="20px">
                    <TYPE.main mr="4px">TVL: </TYPE.main>
                    <TYPE.label mr="4px">{formatDollarAmount(protocolData?.tvlUSD)}</TYPE.label>
                    <TYPE.main></TYPE.main>
                    <Percent value={protocolData?.tvlUSDChange} wrap={true} />
                  </RowFixed>
                </HideMedium>
              </RowBetween>
            </DarkGreyCard>
          </ChartWrapper>

          <TopWrapper scrollColor={activeNetwork.scrollColor}>
            <RowBetween padding="0 20px 5px 5px">
              <TYPE.main>Top Tokens</TYPE.main>
              <StyledInternalLink to="market" color={activeNetwork.primaryColor}>
                Explore
              </StyledInternalLink>
            </RowBetween>
            <TokenTable tokenDatas={formattedTokens} />
            <RowBetween padding="15px 20px 5px 5px">
              <TYPE.main>Top Pools</TYPE.main>
              <StyledInternalLink to="market" color={activeNetwork.primaryColor}>
                Explore
              </StyledInternalLink>
            </RowBetween>
            <PoolTable poolDatas={poolDatas} />
            <RowBetween padding="15px 20px 5px 5px">
              <TYPE.main>Transactions</TYPE.main>
            </RowBetween>
            {transactions ? (
              <TransactionsTable transactions={transactions} color={activeNetwork.primaryColor} />
            ) : (
              <LoadingRows>
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
                <div />
              </LoadingRows>
            )}
          </TopWrapper>
        </ResponsiveRow>
      </AutoColumn>
    </PageWrapper>
  )
}
