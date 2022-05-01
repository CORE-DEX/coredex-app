import CMCLogo from 'assets/images/cmc.png'
import BarChart from 'components/BarChart/alt'
import { SavedIcon } from 'components/Button'
import CandleChart from 'components/CandleChart'
import { DarkGreyCard, LightGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import LineChart from 'components/LineChart/alt'
import { LocalLoader } from 'components/Loader'
import Loader from 'components/Loader'
import { GenericImageWrapper } from 'components/Logo'
import Percent from 'components/Percent'
import { RowBetween, RowFixed, RowFlat } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle'
import { L1ChainInfo } from 'constants/chainInfo'
import { ONE_HOUR_SECONDS, TimeWindow } from 'constants/intervals'
import dayjs from 'dayjs'
import { useCMCLink } from 'hooks/useCMCLink'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import React, { useEffect, useMemo, useState } from 'react'
import { ExternalLink } from 'react-feather'
import { usePoolDatas } from 'state/pools/hooks'
import {
  usePoolsForToken,
  useTokenChartData,
  useTokenData,
  useTokenPriceData,
  useTokenTransactions,
} from 'state/tokens/hooks'
import { useSavedTokens } from 'state/user/hooks'
import styled from 'styled-components'
import { ExternalLink as StyledExternalLink } from 'theme/components'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'

import { TYPE } from '../../theme'
import { currentTimestamp, getEtherscanLink } from '../../utils'

const ColumnWrapper = styled.div`
  display: flex;
  height: calc(100% - 378px - 5px);
  flex-direction: column;
  justify-content: flex-start;
  margin-bottom: 5px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: 430px;
    margin-bottom: 20px;
  `};
`

const ChartWrapper = styled.div`
  flex-direction: column;
  width: calc(100% - 200px - 5px);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
    height: calc(100% - 65px - 5px);
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
    padding: 0.3rem 1rem 0.3rem 1rem;
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

const PriceText = styled(TYPE.label)`
  font-size: 30px;
  line-height: 0.8;
`

const ContentLayout = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: calc(100% - 44px);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: calc(100% - 75px);
  `};
`

const Hide1280 = styled.div`
  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: none;
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

const StyledCMCLogo = styled.img`
  height: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
`

enum ChartView {
  TVL,
  VOL,
  PRICE,
}

const DEFAULT_TIME_WINDOW = TimeWindow.WEEK

export default function TokenChart({
  address,
  activeNetwork,
  smallOrder,
}: {
  address: string
  activeNetwork: L1ChainInfo
  smallOrder: boolean
}) {
  // theming
  const backgroundColor = useColor(address)
  const theme = useTheme()

  // scroll on page view
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const tokenData = useTokenData(address)
  const poolsForToken = usePoolsForToken(address)
  const poolDatas = usePoolDatas(poolsForToken ?? [])
  const transactions = useTokenTransactions(address)
  const chartData = useTokenChartData(address)

  // check for link to CMC
  const cmcLink = useCMCLink(address)

  // format for chart component
  const formattedTvlTokenData = useMemo(() => {
    if (chartData) {
      return chartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.totalValueLockedUSD,
        }
      })
    } else {
      return []
    }
  }, [chartData])
  const formattedVolumeTokenData = useMemo(() => {
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

  // chart labels
  const [view, setView] = useState(ChartView.TVL)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()
  const [timeWindow] = useState(DEFAULT_TIME_WINDOW)

  // pricing data
  const priceData = useTokenPriceData(address, ONE_HOUR_SECONDS, timeWindow)
  const adjustedToCurrent = useMemo(() => {
    if (priceData && tokenData && priceData.length > 0) {
      const adjusted = Object.assign([], priceData)
      adjusted.push({
        time: currentTimestamp() / 1000,
        open: priceData[priceData.length - 1].close,
        close: tokenData?.priceUSD,
        high: tokenData?.priceUSD,
        low: priceData[priceData.length - 1].close,
      })
      return adjusted
    } else {
      return undefined
    }
  }, [priceData, tokenData])

  // watchlist
  const [savedTokens, addSavedToken] = useSavedTokens()

  const topLeft = () => {
    return (
      <RowBetween align="flex-start">
        {tokenData ? (
          <AutoColumn>
            <RowFixed>
              <TYPE.label fontSize="24px" height="30px">
                <MonoSpace>
                  {latestValue
                    ? formatDollarAmount(latestValue, 2)
                    : view === ChartView.VOL
                    ? formatDollarAmount(formattedVolumeTokenData[formattedVolumeTokenData.length - 1]?.value)
                    : view === ChartView.TVL
                    ? formatDollarAmount(formattedTvlTokenData[formattedTvlTokenData.length - 1]?.value)
                    : formatDollarAmount(tokenData.priceUSD, 2)}
                </MonoSpace>
              </TYPE.label>
            </RowFixed>
            <TYPE.main height="20px" fontSize="12px">
              {valueLabel ? (
                <MonoSpace>{valueLabel} (UTC)</MonoSpace>
              ) : (
                <MonoSpace>{dayjs.utc().format('MMM D, YYYY')}</MonoSpace>
              )}
            </TYPE.main>
          </AutoColumn>
        ) : null}
        <ToggleWrapper width="225px">
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
            onClick={() => (view === ChartView.TVL ? setView(ChartView.PRICE) : setView(ChartView.TVL))}
          >
            TVL
          </ToggleElementFree>
          <ToggleElementFree
            isActive={view === ChartView.PRICE}
            fontSize="12px"
            onClick={() => setView(ChartView.PRICE)}
          >
            Price
          </ToggleElementFree>
        </ToggleWrapper>
      </RowBetween>
    )
  }

  return tokenData ? (
    !tokenData.exists ? (
      <LightGreyCard style={{ textAlign: 'center' }} width="74%">
        No pool has been created with this token yet. Create one
        <StyledExternalLink style={{ marginLeft: '4px' }} href={`https://app.uniswap.org/#/add/${address}`}>
          here.
        </StyledExternalLink>
      </LightGreyCard>
    ) : (
      <ColumnWrapper>
        <ResponsiveRow align="flex-end" padding="0 0 15px 0">
          <RowFixed gap="lg">
            <CurrencyLogo size="24px" address={address} />
            {smallOrder ? (
              <TYPE.label ml={'8px'} fontSize="24px">
                {tokenData.symbol}
              </TYPE.label>
            ) : (
              <>
                <TYPE.label ml={'10px'} fontSize="24px">
                  {tokenData.name}
                </TYPE.label>
                <TYPE.main ml={'8px'} fontSize="24px">
                  ({tokenData.symbol})
                </TYPE.main>
              </>
            )}
            {activeNetwork.label === 'Ethereum' ? null : (
              <GenericImageWrapper src={activeNetwork.logoUrl} style={{ marginLeft: '8px' }} size={'24px'} />
            )}
            <RowFlat style={{ marginLeft: '24px' }}>
              <PriceText mr="10px"> {formatDollarAmount(tokenData.priceUSD)}</PriceText>
              (<Percent value={tokenData.priceUSDChange} />)
            </RowFlat>
          </RowFixed>
          <RowFixed align="center" justify="center">
            <SavedIcon
              fill={savedTokens.includes(address)}
              onClick={() => addSavedToken(address)}
              style={{ marginRight: '12px' }}
            />
            {cmcLink && (
              <StyledExternalLink href={cmcLink} style={{ marginRight: '12px' }}>
                <StyledCMCLogo src={CMCLogo} />
              </StyledExternalLink>
            )}
            <StyledExternalLink href={getEtherscanLink(1, address, 'address')}>
              <ExternalLink stroke={theme.text2} size={'17px'} style={{ marginRight: '12px' }} />
            </StyledExternalLink>
          </RowFixed>
        </ResponsiveRow>
        <ContentLayout>
          <ValueWrapper scrollColor={activeNetwork.scrollColor}>
            <ResponsiveColumn gap="18px">
              <AutoColumn gap="4px">
                <TYPE.main fontWeight={400}>TVL</TYPE.main>
                <ResponsiveColumn marginRight="20px">
                  <TYPE.label fontSize="24px">{formatDollarAmount(tokenData.tvlUSD)}</TYPE.label>
                  <Percent value={tokenData.tvlUSDChange} />
                </ResponsiveColumn>
              </AutoColumn>
              <AutoColumn gap="4px">
                <TYPE.main fontWeight={400}>TradingVolume</TYPE.main>
                <ResponsiveColumn>
                  <ResponsiveColumn marginRight="10px">
                    <RowFlat>
                      <TYPE.label fontSize="24px" marginRight="4px">
                        {formatDollarAmount(tokenData.volumeUSD)}{' '}
                      </TYPE.label>
                      <TYPE.italic marginRight="4px">(24h)</TYPE.italic>
                    </RowFlat>
                    <Percent value={tokenData.volumeUSDChange} />
                  </ResponsiveColumn>
                  <ResponsiveColumn marginRight="20px">
                    <RowFlat>
                      <TYPE.label fontSize="24px" marginLeft="4px">
                        {formatDollarAmount(tokenData.volumeUSDWeek)}
                      </TYPE.label>
                      <TYPE.italic marginLeft="4px">(7d)</TYPE.italic>
                    </RowFlat>
                  </ResponsiveColumn>
                </ResponsiveColumn>
              </AutoColumn>
              <AutoColumn gap="4px">
                <TYPE.main fontWeight={400}>24hTransactions</TYPE.main>
                <ResponsiveColumn gap="4px">
                  <TYPE.label fontSize="24px" marginRight="1rem">
                    {tokenData.txCount}
                  </TYPE.label>
                </ResponsiveColumn>
              </AutoColumn>
            </ResponsiveColumn>
          </ValueWrapper>
          <ChartWrapper>
            {view === ChartView.TVL ? (
              Object.keys(formattedTvlTokenData).length ? (
                <LineChart
                  data={formattedTvlTokenData}
                  color={backgroundColor}
                  value={latestValue}
                  label={valueLabel}
                  setValue={setLatestValue}
                  setLabel={setValueLabel}
                  topLeft={topLeft()}
                />
              ) : (
                <LocalLoader fill={false} />
              )
            ) : view === ChartView.VOL ? (
              Object.keys(formattedVolumeTokenData).length ? (
                <BarChart
                  data={formattedVolumeTokenData}
                  color={backgroundColor}
                  value={latestValue}
                  label={valueLabel}
                  setValue={setLatestValue}
                  setLabel={setValueLabel}
                  topLeft={topLeft()}
                />
              ) : (
                <LocalLoader fill={false} />
              )
            ) : view === ChartView.PRICE ? (
              adjustedToCurrent ? (
                <CandleChart
                  data={adjustedToCurrent}
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
    )
  ) : (
    <Loader />
  )
}
