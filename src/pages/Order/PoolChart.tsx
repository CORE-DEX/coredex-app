import BarChart from 'components/BarChart/alt'
import CandleChart from 'components/CandleChart'
import { DarkGreyCard, GreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import LineChart from 'components/LineChart/alt'
import Loader, { LocalLoader } from 'components/Loader'
import Percent from 'components/Percent'
import Row, { RowBetween, RowFixed } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
import { L1ChainInfo } from 'constants/chainInfo'
import { ONE_HOUR_SECONDS, TimeWindow } from 'constants/intervals'
import dayjs from 'dayjs'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import React, { useEffect, useMemo, useState } from 'react'
import { usePoolChartData, usePoolDatas, usePoolHourlyRates, usePoolTransactions } from 'state/pools/hooks'
import styled from 'styled-components'
import { unixToDate } from 'utils/date'
import { formatAmount, formatDollarAmount } from 'utils/numbers'

import { StyledInternalLink, TYPE } from '../../theme'
import { PriceChartEntry } from '../../types'

const ColumnWrapper = styled.div`
  display: flex;
  height: calc(100% - 378px - 5px);
  flex-direction: column;
  justify-content: flex-start;
  margin-bottom: 5px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: 440px;
    margin-bottom: 20px;
  `};
`

const ChartWrapper = styled.div`
  flex-direction: column;
  width: calc(100% - 200px - 5px);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
    height: calc(100% - 65px);
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: calc(100% - 105px);
  `};
`

const ValueWrapper = styled(DarkGreyCard)<{ scrollColor?: string }>`
  width: 200px;
  margin-right: 5px;

  ::-webkit-scrollbar {
    height: 5px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.bg2};
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ scrollColor }) => (scrollColor ? scrollColor : '#00cc227a')};
    opacity: 0.5;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: flex;
    width: 100%;
    margin-right: 0;
    margin-bottom: 5px;
    overflow-x: auto;
  `};
`

const ResponsiveColumn = styled(AutoColumn)<{ marginRight?: string }>`
  margin-right: ${({ marginRight }) => (marginRight ? marginRight : '0')};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: flex;
    flex-direction: row;
    align-items: end;
  `};
`

const ContentLayout = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: calc(100% - 44px);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    height: calc(100% - 66px);
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: calc(100% - 88px);
  `};
`

const LockedTokenCard = styled(GreyCard)<{ padd?: string }>`
  padding: ${({ padd }) => (padd ? padd : '0')};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 2px;
    margin-right: 18px;
  `};
`

const TokenButton = styled(GreyCard)<{ positionRight?: string }>`
  position: relative;
  right: ${({ positionRight }) => positionRight ?? '0'};
  padding: 6px 12px;
  :hover {
    cursor: pointer;
    opacity: 0.6;
  }

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 3px 3px;
    right: 0;
  `};
`

const ResponsiveRowButton = styled(Row)`
  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
    align-items: flex-end;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    align-items: flex-start;
  `};
`

const ResponsiveRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-start;
    row-gap: 10px;
    width: 100%;
  `};
`

enum ChartView {
  TVL,
  VOL,
  RATE,
}

const DEFAULT_TIME_WINDOW = TimeWindow.WEEK

export default function PoolChart({
  address,
  activeNetwork,
  smallOrder,
}: {
  address: string
  activeNetwork: L1ChainInfo
  smallOrder: boolean
}) {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // theming
  const backgroundColor = useColor()
  const theme = useTheme()

  // token data
  const poolData = usePoolDatas([address])[0]
  const chartData = usePoolChartData(address)
  const transactions = usePoolTransactions(address)

  const [view, setView] = useState(ChartView.VOL)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()

  const formattedTvlData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.reserveUSD,
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
          value: day.dailyVolumeUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])

  const [timeWindow] = useState(DEFAULT_TIME_WINDOW)

  const formattedSymbol0 =
    poolData?.token0?.symbol.length > 6 ? poolData?.token0?.symbol.slice(0, 5) + '...' : poolData?.token0?.symbol
  const formattedSymbol1 =
    poolData?.token1?.symbol.length > 6 ? poolData?.token1?.symbol.slice(0, 5) + '...' : poolData?.token1?.symbol

  const { rate0, rate1 } = usePoolHourlyRates(address, ONE_HOUR_SECONDS, timeWindow)
  const base0 = poolData?.reserve0 / poolData?.reserve1
  const base1 = poolData?.reserve1 / poolData?.reserve0
  const formattedRate0: (any[] & PriceChartEntry[]) | undefined = useMemo(() => {
    if (rate0 && poolData && rate0.length > 0) {
      const formatted = Object.assign([], rate0)
      formatted.push({
        time: dayjs().unix(),
        open: rate0[rate0.length - 1].close,
        close: base0,
        high: base0,
        low: rate0[rate0.length - 1].close,
      })
      return formatted
    } else {
      return undefined
    }
  }, [base0, rate0, poolData])
  const formattedRate1: (any[] & PriceChartEntry[]) | undefined = useMemo(() => {
    if (rate1 && poolData && rate1.length > 0) {
      const formatted = Object.assign([], rate1)
      formatted.push({
        time: dayjs().unix(),
        open: rate1[rate1.length - 1].close,
        close: base1,
        high: base1,
        low: rate1[rate1.length - 1].close,
      })
      return formatted
    } else {
      return undefined
    }
  }, [base1, rate1, poolData])

  let rateData: (any[] & PriceChartEntry[]) | undefined
  if (base0 >= base1) {
    rateData = formattedRate0
  } else {
    rateData = formattedRate1
  }

  const topLeft = () => {
    return (
      <RowBetween align="flex-start">
        <AutoColumn>
          <TYPE.label fontSize="24px" height="30px">
            <MonoSpace>
              {latestValue
                ? formatDollarAmount(latestValue)
                : view === ChartView.VOL
                ? formatDollarAmount(formattedVolumeData[formattedVolumeData.length - 1]?.value)
                : view === ChartView.RATE
                ? rateData && formatDollarAmount(rateData[rateData.length - 1].open)
                : formatDollarAmount(formattedTvlData[formattedTvlData.length - 1]?.value)}{' '}
            </MonoSpace>
          </TYPE.label>
          <TYPE.main height="20px" fontSize="12px">
            {valueLabel ? <MonoSpace>{valueLabel} (UTC)</MonoSpace> : ''}
          </TYPE.main>
        </AutoColumn>
        <ToggleWrapper width="230px">
          <ToggleElementFree
            isActive={view === ChartView.VOL}
            fontSize="12px"
            onClick={() => (view === ChartView.VOL ? setView(ChartView.TVL) : setView(ChartView.VOL))}
          >
            Volume
          </ToggleElementFree>
          <ToggleElementFree
            isActive={view === ChartView.TVL}
            fontSize="12px"
            onClick={() => (view === ChartView.TVL ? setView(ChartView.RATE) : setView(ChartView.TVL))}
          >
            TVL
          </ToggleElementFree>
          {rateData === formattedRate0 ? (
            <ToggleElementFree
              isActive={view === ChartView.RATE}
              fontSize="12px"
              onClick={() => (view === ChartView.RATE ? setView(ChartView.VOL) : setView(ChartView.RATE))}
            >
              {poolData.token0 ? formattedSymbol0 + '/' + formattedSymbol1 : '-'}
            </ToggleElementFree>
          ) : (
            <ToggleElementFree
              isActive={view === ChartView.RATE}
              fontSize="12px"
              onClick={() => (view === ChartView.RATE ? setView(ChartView.VOL) : setView(ChartView.RATE))}
            >
              {poolData.token0 ? formattedSymbol1 + '/' + formattedSymbol0 : '-'}
            </ToggleElementFree>
          )}
        </ToggleWrapper>
      </RowBetween>
    )
  }

  return poolData ? (
    <ColumnWrapper>
      <ResponsiveRow align="flex-end" padding="0 0 10px 0">
        <RowFixed>
          <DoubleCurrencyLogo address0={poolData.token0.address} address1={poolData.token1.address} size={24} />
          <TYPE.label
            ml="8px"
            mr="8px"
            fontSize="24px"
          >{` ${poolData.token0.symbol} / ${poolData.token1.symbol} `}</TYPE.label>
        </RowFixed>
        <RowFixed>
          <ResponsiveRowButton>
            <StyledInternalLink to={`order?outputCurrency=${poolData.token0.address}`}>
              <TokenButton positionRight="5px">
                <RowFixed>
                  <CurrencyLogo address={poolData.token0.address} size={'18px'} />
                  <TYPE.label fontSize="14px" ml="4px" style={{ whiteSpace: 'nowrap' }} width={'fit-content'}>
                    {`1 ${poolData.token0.symbol} =  ${formatAmount(poolData.token1Price, 4)} ${
                      poolData.token1.symbol
                    }`}
                  </TYPE.label>
                </RowFixed>
              </TokenButton>
            </StyledInternalLink>
            <StyledInternalLink to={`order?outputCurrency=${poolData.token1.address}`}>
              <TokenButton>
                <RowFixed>
                  <CurrencyLogo address={poolData.token1.address} size={'18px'} />
                  <TYPE.label fontSize="14px" ml="4px" style={{ whiteSpace: 'nowrap' }} width={'fit-content'}>
                    {`1 ${poolData.token1.symbol} =  ${formatAmount(poolData.token0Price, 4)} ${
                      poolData.token0.symbol
                    }`}
                  </TYPE.label>
                </RowFixed>
              </TokenButton>
            </StyledInternalLink>
          </ResponsiveRowButton>
        </RowFixed>
      </ResponsiveRow>
      <ContentLayout>
        <ValueWrapper scrollColor={activeNetwork.scrollColor}>
          <ResponsiveColumn gap="12px">
            <LockedTokenCard padd="10px">
              <ResponsiveColumn gap="md">
                {smallOrder ? null : <TYPE.main>LockedTokens</TYPE.main>}
                <RowBetween width={smallOrder ? '115px' : ''} marginRight={smallOrder ? '30px' : ''}>
                  <RowFixed>
                    <CurrencyLogo address={poolData.token0.address} size={'20px'} />
                    <TYPE.label fontSize="14px" ml={smallOrder ? '2px' : '8px'}>
                      {poolData.token0.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <TYPE.label fontSize="14px">{formatAmount(poolData.reserve0)}</TYPE.label>
                </RowBetween>
                <RowBetween width={smallOrder ? '115px' : ''} marginRight={smallOrder ? '30px' : ''}>
                  <RowFixed>
                    <CurrencyLogo address={poolData.token1.address} size={'20px'} />
                    <TYPE.label fontSize="14px" ml={smallOrder ? '2px' : '8px'}>
                      {poolData.token1.symbol}
                    </TYPE.label>
                  </RowFixed>
                  <TYPE.label fontSize="14px">{formatAmount(poolData.reserve1)}</TYPE.label>
                </RowBetween>
                <RowBetween width={smallOrder ? '140px' : ''}>
                  <RowFixed>
                    <TYPE.label fontSize="14px" mr="8px">
                      TVL
                    </TYPE.label>
                    <Percent fontSize="14px" value={poolData.tvlUSDChange} />
                  </RowFixed>
                  <TYPE.label fontSize="14px">{formatDollarAmount(poolData.tvlUSD)}</TYPE.label>
                </RowBetween>
              </ResponsiveColumn>
            </LockedTokenCard>
            <ResponsiveColumn gap="4px" marginRight="18px">
              <TYPE.main fontWeight={400} marginRight="4px">
                Volume24h
              </TYPE.main>
              <TYPE.label fontSize="24px" marginRight="4px">
                {formatDollarAmount(poolData.volumeUSD)}
              </TYPE.label>
              <Percent value={poolData.volumeUSDChange} />
            </ResponsiveColumn>
            <ResponsiveColumn gap="4px">
              <TYPE.main fontWeight={400} marginRight="4px">
                24hFees
              </TYPE.main>
              <TYPE.label fontSize="24px">
                {formatDollarAmount(poolData.volumeUSD * (poolData.fees / 1000000))}
              </TYPE.label>
            </ResponsiveColumn>
          </ResponsiveColumn>
        </ValueWrapper>
        <ChartWrapper>
          {view === ChartView.TVL ? (
            Object.keys(formattedTvlData).length ? (
              <LineChart
                data={formattedTvlData}
                setLabel={setValueLabel}
                color={backgroundColor}
                setValue={setLatestValue}
                value={latestValue}
                label={valueLabel}
                topLeft={topLeft()}
              />
            ) : (
              <LocalLoader fill={false} />
            )
          ) : view === ChartView.VOL ? (
            Object.keys(formattedVolumeData).length ? (
              <BarChart
                data={formattedVolumeData}
                color={backgroundColor}
                setValue={setLatestValue}
                setLabel={setValueLabel}
                value={latestValue}
                label={valueLabel}
                topLeft={topLeft()}
              />
            ) : (
              <LocalLoader fill={false} />
            )
          ) : view === ChartView.RATE ? (
            (rate0 || rate1) && rateData ? (
              <CandleChart
                data={rateData}
                setValue={setLatestValue}
                setLabel={setValueLabel}
                color={backgroundColor}
                topLeft={topLeft()}
              />
            ) : (
              <LocalLoader fill={false} />
            )
          ) : null}
        </ChartWrapper>
      </ContentLayout>
    </ColumnWrapper>
  ) : (
    <Loader />
  )
}
