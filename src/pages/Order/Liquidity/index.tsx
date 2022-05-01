import { Pair } from '@cocore/swap-sdk'
import { ButtonPrimary, ButtonSecondary } from 'components/Button'
import Card, { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
//import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
//import { SwapPoolTabs } from '../../components/NavigationTabs'
import FullPositionCard from 'components/PositionCard'
import { RowBetween, RowFixed } from 'components/Row'
import { Dots } from 'components/swap/styleds'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle'
import { L1ChainInfo } from 'constants/chainInfo'
import { usePairs } from 'hooks/usePairs'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useActiveWeb3React } from 'hooks/web3'
import { ParsedQs } from 'qs'
import React, { useContext, useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { toLiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import styled, { ThemeContext } from 'styled-components/macro'

import { StyledInternalLink, TYPE } from '../../../theme'
import Add from './Add'
import PoolFinder from './PoolFinder'
import Remove from './Remove'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  border-radius: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const ResponsiveButtonSecondary = styled(ButtonSecondary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `};
`

const ContentWrapper = styled(DarkGreyCard)<{ contentWidth?: string; scrollColor?: string }>`
  height: calc(84vh - 35.5px - 8px);
  overflow-y: auto;

  @media (max-height: 900px) {
    height: 706px;
  }

  @media (min-width: 1920px) {
    width: ${({ contentWidth }) => contentWidth};
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    height: 100%;
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

const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

enum LiquidityState {
  VIEW,
  IMPORT,
  ADD,
}

function useQueryParametersDiscrimination(parsedQs: ParsedQs): {
  request: LiquidityState
  addCurrency: (string | undefined)[]
  removeCurrency: (string | undefined)[]
} {
  const [addCurrency, setAddCurrency] = useState<(string | undefined)[]>([undefined, undefined])
  const [removeCurrency, setRemoveCurrency] = useState<(string | undefined)[]>([undefined, undefined])
  const [request, setRequest] = useState<LiquidityState>(LiquidityState.VIEW)

  const mode = parsedQs.mode
  const currencyIdA = parsedQs.currencyIdA
  const currencyIdB = parsedQs.currencyIdB
  useEffect(() => {
    if (mode === 'import') {
      setAddCurrency([undefined, undefined])
      setRemoveCurrency([undefined, undefined])
      setRequest(LiquidityState.IMPORT)
    } else if (mode === 'add' && currencyIdA === undefined && currencyIdB === undefined) {
      setAddCurrency([undefined, undefined])
      setRemoveCurrency([undefined, undefined])
      setRequest(LiquidityState.ADD)
    } else if (mode === 'add' && currencyIdA && currencyIdB === undefined) {
      setAddCurrency([currencyIdA.toString().toLowerCase(), undefined])
      setRemoveCurrency([undefined, undefined])
      setRequest(LiquidityState.ADD)
    } else if (mode === 'add' && currencyIdA && currencyIdB) {
      setAddCurrency([currencyIdA.toString().toLowerCase(), currencyIdB.toString().toLowerCase()])
      setRemoveCurrency([undefined, undefined])
      setRequest(LiquidityState.ADD)
    } else if (mode === 'remove' && currencyIdA && currencyIdB) {
      setAddCurrency([undefined, undefined])
      setRemoveCurrency([currencyIdA.toString().toLowerCase(), currencyIdB.toString().toLowerCase()])
      setRequest(LiquidityState.ADD)
    } else if (mode === 'liquidity' || (!currencyIdA && !currencyIdB)) {
      setAddCurrency([undefined, undefined])
      setRemoveCurrency([undefined, undefined])
      setRequest(LiquidityState.VIEW)
    }
  }, [currencyIdA, currencyIdB, mode])

  return { request, addCurrency, removeCurrency }
}

export default function Liquidity({
  activeNetwork,
  width,
  minWidth,
}: {
  activeNetwork: L1ChainInfo
  width?: string
  minWidth?: string
}) {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()
  const history = useHistory()
  const [liquidityState, setLiquidityState] = useState(LiquidityState.VIEW)
  const parsedQs = useParsedQueryString()
  const { request, addCurrency, removeCurrency } = useQueryParametersDiscrimination(parsedQs)

  useEffect(() => {
    setLiquidityState(request)
  }, [request])

  // fetch the user's balances of all tracked LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toLiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(
    () => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken),
    [tokenPairsWithLiquidityTokens]
  )
  const [pairsBalances, fetchingPairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        pairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, pairsBalances]
  )

  const pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const isLoading =
    fetchingPairBalances || pairs?.length < liquidityTokensWithBalances.length || pairs?.some((pair) => !pair)

  const allPairsWithLiquidity = pairs.map(([, pair]) => pair).filter((pair): pair is Pair => Boolean(pair))

  return (
    <>
      {/*<PageWrapper>*/}
      {/*
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Liquidity provider rewards</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  Liquidity providers earn a 0.3% fee on all trades proportional to their share of the pool. Fees are
                  added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
                </TYPE.white>
              </RowBetween>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>
        */}
      {/*<AutoColumn gap="lg" justify="center">*/}

      <ToggleWrapper width="100%" marginBottom="5px">
        <ToggleElementFree
          isActive={liquidityState === LiquidityState.VIEW}
          fontSize="18px"
          onClick={() => {
            liquidityState === LiquidityState.VIEW
              ? setLiquidityState(LiquidityState.ADD)
              : setLiquidityState(LiquidityState.VIEW)
            history.push('/order?mode=liquidity')
          }}
        >
          Liquidity
        </ToggleElementFree>
        {/*
          <ToggleElementFree
            isActive={liquidityState === LiquidityState.CREATE}
            fontSize="16px"
            onClick={() =>
              liquidityState === LiquidityState.CREATE
                ? setLiquidityState(LiquidityState.IMPORT)
                : setLiquidityState(LiquidityState.CREATE)
            }
          >
            Create
          </ToggleElementFree>
          */}
        <ToggleElementFree
          isActive={liquidityState === LiquidityState.ADD}
          fontSize="18px"
          onClick={() => {
            liquidityState === LiquidityState.ADD
              ? setLiquidityState(LiquidityState.IMPORT)
              : setLiquidityState(LiquidityState.ADD)
            history.push('/order?mode=add')
          }}
        >
          Add/Create
        </ToggleElementFree>
        <ToggleElementFree
          isActive={liquidityState === LiquidityState.IMPORT}
          fontSize="18px"
          onClick={() => {
            liquidityState === LiquidityState.IMPORT
              ? setLiquidityState(LiquidityState.ADD)
              : setLiquidityState(LiquidityState.IMPORT)
            history.push('/order?mode=import')
          }}
        >
          Import
        </ToggleElementFree>
      </ToggleWrapper>

      <ContentWrapper contentWidth={width} width={minWidth} scrollColor={activeNetwork.scrollColor}>
        <AutoColumn gap="md" style={{ width: '100%' }}>
          {liquidityState === LiquidityState.VIEW ? (
            !account ? (
              <Card padding="40px">
                <TYPE.body color={theme.text3} textAlign="center">
                  Connect to a wallet to view your liquidity.
                </TYPE.body>
              </Card>
            ) : isLoading ? (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </EmptyProposals>
            ) : allPairsWithLiquidity?.length > 0 ? (
              <>
                <TYPE.mediumHeader fontWeight={500} fontSize={20} style={{ flex: '1', margin: 'auto' }}>
                  Your liquidity
                </TYPE.mediumHeader>
                <ButtonSecondary>
                  <RowBetween>
                    <StyledInternalLink to={`account`}>Account analytics and accrued fees</StyledInternalLink>
                    <span> ↗ </span>
                  </RowBetween>
                </ButtonSecondary>
                {allPairsWithLiquidity.map((pair) => (
                  <FullPositionCard key={pair.liquidityToken.address} pair={pair} />
                ))}
              </>
            ) : (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </EmptyProposals>
            )
          ) : liquidityState === LiquidityState.ADD ? (
            removeCurrency[0] && removeCurrency[1] ? (
              <Remove currency={removeCurrency} />
            ) : (
              <Add currency={addCurrency} />
            )
          ) : (
            <PoolFinder />
          )}
        </AutoColumn>
      </ContentWrapper>
      {/*</AutoColumn>*/}
      {/*</PageWrapper>*/}
    </>
  )
}
