import ToggleBorder from 'assets/images/toggle_border.png'
import { ButtonPrimary } from 'components/Button'
import { DarkGreyCard, LightGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import LineChart from 'components/LineChart/alt'
import Loader, { LoadingRows, LocalLoader } from 'components/Loader'
import { GenericImageWrapper } from 'components/Logo'
import PositionTable from 'components/positions/PositionTable'
import Row, { MenuRow, RowBetween, RowFixed, RowFlat } from 'components/Row'
import { MonoSpace } from 'components/shared'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle/index'
import TransactionTable from 'components/TransactionsTable'
import { FEE_WARNING_TOKENS } from 'constants/addresses'
import { CHAIN_INFO } from 'constants/chainInfo'
import dayjs from 'dayjs'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks/web3'
import { PageWrapper } from 'pages/styled'
import React, { useEffect, useMemo, useState } from 'react'
import { Activity } from 'react-feather'
import { Link } from 'react-router-dom'
import { useWindowSize } from 'react-use'
import {
  useAddUserKeys,
  useUserLiquidityChart,
  useUserPositions,
  useUserPotitionChart,
  useUserTransactions,
} from 'state/user/chart/hooks'
import styled from 'styled-components'
import { unixToDate } from 'utils/date'
import { formatDollarAmount } from 'utils/numbers'
import { formatTokenSymbol } from 'utils/tokens'

import { TYPE } from '../../theme'
import { LPReturn, Transaction, TransactionType } from '../../types'
import { shortenAddress } from '../../utils'

const STATS_CARD_MINWIDTH = '350px'
const STATS_CARD_WIDTH = '23vw'
const TABLE_HEIGHT = '337px'

const AccountText = styled(TYPE.label)`
  font-size: 30px;
  line-height: 0.8;
`

const StyledIcon = styled.div`
  color: ${({ theme }) => theme.text1};
`

const PositionCard = styled.div`
  width: 100%;
  background-color: ${({ theme }) => theme.bg1};
  z-index: 999;
  padding-top: 4px;
  border: 1px solid #00cc22;
`

const ColumnWrapper = styled.div`
  display: flex;
  width: ${`calc(100% - ${STATS_CARD_MINWIDTH} - 5px)`};
  height: 100%;
  flex-direction: column;
  justify-content: flex-start;

  @media (min-width: 1920px) {
    width: calc(100% - ${STATS_CARD_WIDTH} - 5px);
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    margin-right: 0;
    margin-bottom: 20px;
  `};
`

const ChartWrapper = styled.div`
  flex-direction: column;
  width: calc(100% - 240px - 5px);

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
    height: calc(100% - 65px - 5px);
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: 335px;
  `};
`

const ListWrapper = styled.div`
  width: ${STATS_CARD_MINWIDTH};
  height: 100%;

  @media (min-width: 1920px) {
    width: ${STATS_CARD_WIDTH};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    height: 100%;
  `};
`

const PositionWrapper = styled(DarkGreyCard)<{ scrollColor?: string }>`
  width: 100%;
  height: calc(100% - 38.5px - 5px);
  overflow-y: auto;

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

const UpperLayout = styled.div`
  display: flex;
  width: 100%;
  height: calc(84vh - 378px - 5px);
  margin-bottom: 5px;
  align-items: flex-start;
  justify-content: space-between;

  @media (max-height: 900px) {
    height: 370px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: 100%;
    flex-direction: column;
    margin-bottom: 20px;
  `};
`

const ResponsiveColumn = styled(AutoColumn)<{ marginRight?: string }>`
  margin-right: ${({ marginRight }) => (marginRight ? marginRight : '0')};
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: flex;
    flex-direction: row;
    align-items: end;
  `};
`

const AccountLayout = styled.div`
  flex-direction: column;
`

const ResponsiveRowTitle = styled(Row)`
  align-items: baseline;
  margin-bottom: 15px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    align-items: flex-start;
    row-gap: 10px;
    width: 100%;
  `};
`

const StatsWrapper = styled(DarkGreyCard)<{ scrollColor?: string }>`
  width: 240px;
  margin-right: 5px;
  overflow-y: auto;

  ::-webkit-scrollbar {
    width: 5px;
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

const TableLayout = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    margin-right: 0px;
  `};
`

const TableWrapper = styled.div<{ marginRight?: string }>`
  width: 50%;
  height: 378px;
  margin-right: ${({ marginRight }) => (marginRight ? marginRight : '0px')};

  ${({ theme }) => theme.mediaWidth.upToLarge`{
    width: 100%;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin-right: 0px;
    margin-bottom: 20px;
  `};
`

const NameWrapper = styled.div<{
  marginBottom?: string
}>`
  width: '100%';
  padding: 0;
  margin-bottom: ${({ marginBottom }) => marginBottom ?? '0'};
  background: rgba(0, 0, 0, 0);
  border: 6px solid;
  border-image-source: ${`url(${ToggleBorder})`};
  border-image-slice: 34%;
  border-image-repeat: repeat;
`

const Wrapper = styled.div`
  display: flex;
  width: 100%;
  height: calc(100% - 39px - 5px);
  flex-direction: row;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    flex-direction: column;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    height: calc(100% - 75px);
  `};
`

function windowState(value: boolean[], innerWidth: number, width: number): boolean {
  if (innerWidth <= width) {
    return value[0]
  } else {
    return value[1]
  }
}

enum ChartView {
  VALUE,
  FEES,
}

enum TableView {
  POSITION,
  TX,
}

export default function AccountPage() {
  const { account, chainId } = useActiveWeb3React()
  const activeNetwork = CHAIN_INFO[chainId ?? -1]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const theme = useTheme()

  const addUserKey = useAddUserKeys()
  if (account) addUserKey()

  // get data for this account
  const transactions = useUserTransactions()
  const positions = useUserPositions()

  // get data for user stats
  const txCount = transactions?.length

  // get derived totals
  const txSwap: Transaction[] = []
  if (transactions) {
    for (const tx of transactions) {
      if (tx.type === TransactionType.SWAP) {
        txSwap.push(tx)
      }
    }
  }
  const totalSwappedUSD = useMemo(() => {
    return txSwap
      ? txSwap.reduce((total, swap) => {
          return total + swap.amountUSD
        }, 0)
      : 0
  }, [txSwap])

  // if any position has token from fee warning list, show warning
  const [showWarning, setShowWarning] = useState(false)
  useEffect(() => {
    if (positions) {
      positions.map((position) => {
        if (!position.pair) return
        if (
          FEE_WARNING_TOKENS.includes(position.pair.token0.id) ||
          FEE_WARNING_TOKENS.includes(position.pair.token1.id)
        ) {
          setShowWarning(true)
        }
      })
    }
  }, [positions])

  // settings for list view and dropdowns
  const hideLPContent = positions && positions.length === 0
  const [showDropdown, setShowDropdown] = useState(false)
  const [activePosition, setActivePosition] = useState<LPReturn>()

  const dynamicPositions = activePosition ? [activePosition] : positions

  const aggregateFees = dynamicPositions?.reduce(function (total, position) {
    if (!position.fees) return total
    return total + position.fees.sum
  }, 0)

  const positionValue = useMemo(() => {
    return dynamicPositions
      ? dynamicPositions.reduce((total, position) => {
          if (!position.liquidityTokenBalance || !position.pair) return total
          return (
            total +
            (parseFloat(position?.liquidityTokenBalance) / parseFloat(position?.pair?.totalSupply)) *
              parseFloat(position?.pair?.reserveUSD)
          )
        }, 0)
      : null
  }, [dynamicPositions])

  // chart labels
  const [view, setView] = useState(ChartView.VALUE)
  const [latestValue, setLatestValue] = useState<number | undefined>()
  const [valueLabel, setValueLabel] = useState<string | undefined>()
  //const [chartData, setChartData] = useState(formattedLiquidityData)

  const liquidityChartData = useUserLiquidityChart()
  const positionChartData = useUserPotitionChart(activePosition)

  const formattedLiquidityData = useMemo(() => {
    if (liquidityChartData) {
      return liquidityChartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.volumeUSD,
        }
      })
    } else {
      return []
    }
  }, [liquidityChartData])
  const formattedValueData = useMemo(() => {
    if (positionChartData) {
      return positionChartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.usdValue,
        }
      })
    } else {
      return []
    }
  }, [positionChartData])
  const formattedFeesData = useMemo(() => {
    if (positionChartData) {
      return positionChartData.map((day) => {
        return {
          time: unixToDate(day.date),
          value: day.fees,
        }
      })
    } else {
      return []
    }
  }, [positionChartData])

  const backgroundColor = useColor()

  const { width: innerWidth } = useWindowSize()
  const [smallOrder, setSmallOrder] = useState(windowState([true, false], innerWidth, 1280))
  useEffect(() => {
    setSmallOrder(windowState([true, false], innerWidth, 1280))
  }, [innerWidth])

  const [tableView, setTableView] = useState(TableView.POSITION)
  useEffect(() => {
    if (smallOrder) {
      setTableView(TableView.POSITION)
    }
  }, [smallOrder])

  const topLeft = () => {
    return (
      <>
        {activePosition ? (
          view === ChartView.FEES ? (
            <TYPE.body fontSize={'14px'}>Fees Value</TYPE.body>
          ) : (
            <TYPE.body fontSize={'14px'}>Liquidity Value</TYPE.body>
          )
        ) : (
          <TYPE.body fontSize={'14px'}>Liquidity Value</TYPE.body>
        )}
        <RowBetween align="flex-start">
          <AutoColumn>
            <RowFixed>
              <TYPE.label fontSize="24px" height="30px">
                <MonoSpace>
                  {latestValue
                    ? formatDollarAmount(latestValue, 2)
                    : view === ChartView.VALUE
                    ? formatDollarAmount(formattedValueData[formattedValueData.length - 1]?.value)
                    : view === ChartView.FEES
                    ? formatDollarAmount(formattedFeesData[formattedFeesData.length - 1]?.value)
                    : '-'}
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
          {activePosition && (
            <ToggleWrapper width="180px">
              <ToggleElementFree
                isActive={view === ChartView.VALUE}
                fontSize="12px"
                onClick={() => (view === ChartView.VALUE ? setView(ChartView.FEES) : setView(ChartView.VALUE))}
              >
                Liquidity
              </ToggleElementFree>
              <ToggleElementFree
                isActive={view === ChartView.FEES}
                fontSize="12px"
                onClick={() => (view === ChartView.FEES ? setView(ChartView.VALUE) : setView(ChartView.FEES))}
              >
                Fees
              </ToggleElementFree>
            </ToggleWrapper>
          )}
        </RowBetween>
      </>
    )
  }

  return (
    <PageWrapper>
      {!account ? (
        <LightGreyCard style={{ textAlign: 'center' }}>Please connect your wallet.</LightGreyCard>
      ) : positions ? (
        <AccountLayout>
          <UpperLayout>
            <ColumnWrapper>
              <ResponsiveRowTitle align="flex-start">
                <RowFixed gap="lg">
                  <TYPE.label ml={'10px'} fontSize="20px">
                    Wallet
                  </TYPE.label>
                  <GenericImageWrapper src={activeNetwork.logoUrl} style={{ marginLeft: '8px' }} size={'26px'} />
                </RowFixed>
                <RowFlat>
                  <AccountText ml="10px" mr="10px">
                    {' '}
                    {shortenAddress(account)}{' '}
                  </AccountText>
                </RowFlat>
              </ResponsiveRowTitle>
              <Wrapper>
                <StatsWrapper scrollColor={activeNetwork.scrollColor}>
                  {showWarning && (
                    <LightGreyCard style={{ textAlign: 'center' }}>
                      Fees cannot currently be calculated for pairs that include AMPL.
                    </LightGreyCard>
                  )}
                  {!hideLPContent && (
                    <ResponsiveColumn gap="18px">
                      <AutoColumn gap="4px">
                        <TYPE.main fontWeight={400} width="185px" marginRight="20px">
                          Liquidity(IncludingFees)
                        </TYPE.main>
                        <RowFixed align="flex-end">
                          <TYPE.label fontSize="24px" lineHeight={1}>
                            {positionValue
                              ? formatDollarAmount(positionValue)
                              : positionValue === 0
                              ? formatDollarAmount(0)
                              : '-'}
                          </TYPE.label>
                        </RowFixed>
                      </AutoColumn>
                      <AutoColumn gap="4px">
                        <TYPE.main fontWeight={400} width="185px" marginRight="20px">
                          FeesEarned(Cumulative)
                        </TYPE.main>
                        <RowFixed align="flex-end">
                          <TYPE.label fontSize="24px" lineHeight={1} color={aggregateFees && 'green'}>
                            {aggregateFees ? formatDollarAmount(aggregateFees) : '-'}
                          </TYPE.label>
                        </RowFixed>
                      </AutoColumn>

                      <AutoColumn gap="4px">
                        <TYPE.main fontWeight={400} width="150px" marginRight="20px">
                          TotalValueSwapped
                        </TYPE.main>
                        <RowFixed align="flex-end">
                          <TYPE.label fontSize="24px" lineHeight={1}>
                            {totalSwappedUSD ? formatDollarAmount(totalSwappedUSD) : '-'}
                          </TYPE.label>
                        </RowFixed>
                      </AutoColumn>
                      <AutoColumn gap="4px">
                        <TYPE.main fontWeight={400} width="110px" marginRight="20px">
                          TotalFeesPaid
                        </TYPE.main>
                        <RowFixed align="flex-end">
                          <TYPE.label fontSize="24px" lineHeight={1}>
                            {totalSwappedUSD ? formatDollarAmount(totalSwappedUSD * 0.003) : '-'}
                          </TYPE.label>
                        </RowFixed>
                      </AutoColumn>
                      <AutoColumn gap="4px">
                        <TYPE.main fontWeight={400} marginRight="20px">
                          TotalTransactions
                        </TYPE.main>
                        <RowFixed align="flex-end">
                          <TYPE.label fontSize="24px" lineHeight={1}>
                            {txCount ? txCount : '-'}
                          </TYPE.label>
                        </RowFixed>
                      </AutoColumn>
                    </ResponsiveColumn>
                  )}
                </StatsWrapper>
                <ChartWrapper>
                  {!hideLPContent ? (
                    <>
                      {activePosition ? (
                        view == ChartView.VALUE ? (
                          Object.keys(formattedValueData).length ? (
                            <LineChart
                              data={formattedValueData}
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
                        ) : view == ChartView.FEES ? (
                          Object.keys(formattedFeesData).length ? (
                            <LineChart
                              data={formattedFeesData}
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
                        ) : null
                      ) : Object.keys(formattedLiquidityData).length ? (
                        <LineChart
                          data={formattedLiquidityData}
                          color={activeNetwork.bgColor}
                          value={latestValue}
                          label={valueLabel}
                          setValue={setLatestValue}
                          setLabel={setValueLabel}
                          topLeft={topLeft()}
                        />
                      ) : (
                        <LocalLoader fill={false} />
                      )}
                    </>
                  ) : (
                    <LightGreyCard style={{ textAlign: 'center', flexDirection: 'row', height: '100%' }}>
                      <Row justify="center">
                        No liquidity.{' '}
                        <Link to={'order?mode=add'}>
                          <ButtonPrimary width="150px" ml="10px">
                            Add liquidity
                          </ButtonPrimary>
                        </Link>
                      </Row>
                    </LightGreyCard>
                  )}
                </ChartWrapper>
              </Wrapper>
            </ColumnWrapper>
            <ListWrapper>
              <NameWrapper marginBottom="5px">
                <TYPE.black fontWeight={600} fontSize={18} style={{ padding: '2.25px 10px', textAlign: 'center' }}>
                  Position List
                </TYPE.black>
              </NameWrapper>
              <PositionWrapper scrollColor={activeNetwork.scrollColor}>
                {!hideLPContent && (
                  <>
                    <PositionCard>
                      <AutoColumn gap="0px">
                        {!activePosition && (
                          <MenuRow style={{ backgroundColor: theme.bg2 }}>
                            <RowFixed>
                              <StyledIcon>
                                <Activity size={16} />
                              </StyledIcon>
                              <TYPE.body ml={'10px'}>All Positions</TYPE.body>
                            </RowFixed>
                          </MenuRow>
                        )}
                        {activePosition && activePosition.pair && (
                          <MenuRow style={{ backgroundColor: theme.bg2 }}>
                            <RowFixed>
                              <DoubleCurrencyLogo
                                address0={activePosition.pair.token0.id}
                                address1={activePosition.pair.token1.id}
                              />
                              <TYPE.body ml={'16px'}>
                                {activePosition.pair.token0.symbol}-{activePosition.pair.token1.symbol} Position
                              </TYPE.body>
                            </RowFixed>
                          </MenuRow>
                        )}
                        {positions?.map((p, i) => {
                          if (!p.pair) return null
                          return (
                            p.pair.id !== activePosition?.pair?.id && (
                              <MenuRow
                                onClick={() => {
                                  setActivePosition(p)
                                  setShowDropdown(false)
                                }}
                                key={i}
                              >
                                <DoubleCurrencyLogo address0={p.pair.token0.id} address1={p.pair.token1.id} />
                                <TYPE.body ml={'16px'}>
                                  {formatTokenSymbol(p.pair.token0.id, p.pair.token0.symbol, chainId)} -
                                  {formatTokenSymbol(p.pair.token1.id, p.pair.token1.symbol, chainId)} Position
                                </TYPE.body>
                              </MenuRow>
                            )
                          )
                        })}
                        {activePosition && (
                          <MenuRow
                            onClick={() => {
                              setActivePosition(undefined)
                              setShowDropdown(false)
                            }}
                          >
                            <RowFixed>
                              <StyledIcon>
                                <Activity size={16} />
                              </StyledIcon>
                              <TYPE.body ml={'10px'}>All Positions</TYPE.body>
                            </RowFixed>
                          </MenuRow>
                        )}
                      </AutoColumn>
                    </PositionCard>
                  </>
                )}
              </PositionWrapper>
            </ListWrapper>
          </UpperLayout>

          {smallOrder ? (
            <TableLayout>
              <TableWrapper marginRight="5px">
                <ToggleWrapper width="100%" marginBottom="5px">
                  <ToggleElementFree
                    isActive={tableView === TableView.POSITION}
                    fontSize="16px"
                    onClick={() =>
                      tableView === TableView.POSITION ? setTableView(TableView.TX) : setTableView(TableView.POSITION)
                    }
                  >
                    Position Details
                  </ToggleElementFree>
                  <ToggleElementFree
                    isActive={tableView === TableView.TX}
                    fontSize="16px"
                    onClick={() =>
                      tableView === TableView.TX ? setTableView(TableView.POSITION) : setTableView(TableView.TX)
                    }
                  >
                    Transactions
                  </ToggleElementFree>
                </ToggleWrapper>
                {tableView === TableView.POSITION ? (
                  <PositionTable
                    positions={positions}
                    maxItems={5}
                    contentHeight={TABLE_HEIGHT}
                    scrollColor={activeNetwork.scrollColor}
                  />
                ) : transactions ? (
                  <TransactionTable
                    transactions={transactions}
                    maxItems={5}
                    contentHeight={TABLE_HEIGHT}
                    scrollColor={activeNetwork.scrollColor}
                  />
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
              </TableWrapper>
            </TableLayout>
          ) : (
            <TableLayout>
              <TableWrapper marginRight="5px">
                <NameWrapper marginBottom="5px">
                  <TYPE.black fontWeight={600} fontSize={18} style={{ padding: '2.25px 10px', textAlign: 'center' }}>
                    Position Details
                  </TYPE.black>
                </NameWrapper>
                <PositionTable
                  positions={positions}
                  maxItems={5}
                  contentHeight={TABLE_HEIGHT}
                  scrollColor={activeNetwork.scrollColor}
                />
              </TableWrapper>
              <TableWrapper>
                <NameWrapper marginBottom="5px">
                  <TYPE.black fontWeight={600} fontSize={18} style={{ padding: '2.25px 10px', textAlign: 'center' }}>
                    Transactions
                  </TYPE.black>
                </NameWrapper>
                {transactions ? (
                  <TransactionTable
                    transactions={transactions}
                    maxItems={5}
                    contentHeight={TABLE_HEIGHT}
                    scrollColor={activeNetwork.scrollColor}
                  />
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
              </TableWrapper>
            </TableLayout>
          )}
        </AccountLayout>
      ) : (
        <Loader />
      )}
    </PageWrapper>
  )
}
