import { ButtonLight } from 'components/Button'
import { DarkGreyCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Loader, { LoadingRows } from 'components/Loader'
import { RowFixed } from 'components/Row'
import { Arrow, Break, PageButtons } from 'components/shared'
import { ClickableText, Label } from 'components/Text'
import { useEthPrices } from 'hooks/useEthPrices'
import useTheme from 'hooks/useTheme'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { formatAmount, formatDollarAmount } from 'utils/numbers'

import { TYPE } from '../../theme'
import { LPReturn } from '../../types'

const Wrapper = styled(DarkGreyCard)<{ contentHeight?: string; scrollColor?: string }>`
  width: 100%;
  overflow-y: auto;

  height: ${({ contentHeight }) => (contentHeight ? contentHeight : 'auto')};

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

const ResponsiveGrid = styled.div`
  display: grid;
  grid-gap: 1em;
  align-items: center;

  grid-template-columns: 20px 1.5fr repeat(2, 1fr);

  @media screen and (max-width: 1000px) {
    grid-template-columns: 20px 1.5fr repeat(1, 1fr);
    & :nth-child(3) {
      display: none;
    }
  }
`

const LinkWrapper = styled(Link)`
  text-decoration: none;
  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

const SORT_FIELD = {
  value: 'value',
  coreDexReturn: 'coreDexReturn',
}

type LPData = {
  fees: {
    sum: number
  }
  pair: {
    id: string
    reserve0: string
    reserve1: string
    reserveUSD: string
    token0: {
      id: string
      symbol: string
      derivedETH: string
    }
    token1: {
      id: string
      symbol: string
      derivedETH: string
    }
    totalSupply: string
  }
  liquidityTokenBalance: string
}

const DataRow = ({ position, index, ethPrice }: { position: LPData; index: number; ethPrice: number }) => {
  const poolOwnership = parseFloat(position.liquidityTokenBalance) / parseFloat(position.pair.totalSupply)
  const valueUSD = poolOwnership * parseFloat(position.pair.reserveUSD)

  const formattedSymbol0 =
    position.pair.token0.symbol.length > 6
      ? ' (' + position.pair.token0.symbol.slice(0, 5) + '...' + ')'
      : ' (' + position.pair.token0.symbol + ')'
  const formattedSymbol1 =
    position.pair.token1.symbol.length > 6
      ? ' (' + position.pair.token1.symbol.slice(0, 5) + '...' + ')'
      : ' (' + position.pair.token1.symbol + ')'

  return (
    <ResponsiveGrid>
      <LinkWrapper to={'order?pool=' + position.pair.id}>
        <Label fontWeight={400}>{index + 1}</Label>
      </LinkWrapper>
      <AutoColumn gap="12px" justify="flex-start">
        <LinkWrapper to={'order?pool=' + position.pair.id}>
          <Label fontWeight={400}>
            <RowFixed>
              <DoubleCurrencyLogo address0={position.pair.token0.id} address1={position.pair.token1.id} />
              <TYPE.label ml="8px">
                {position.pair.token0.symbol}/{position.pair.token1.symbol}
              </TYPE.label>
            </RowFixed>
          </Label>
        </LinkWrapper>
        <RowFixed gap="4px" justify="flex-start">
          <LinkWrapper
            to={`/order?mode=add&currencyIdA=${position.pair.token0.id}&currencyIdB=${position.pair.token1.id}`}
          >
            <ButtonLight width="80px" padding="4px 6px">
              <TYPE.small>Add</TYPE.small>
            </ButtonLight>
          </LinkWrapper>
          {poolOwnership > 0 && (
            <LinkWrapper
              to={`/order?mode=remove&currencyIdA=${position.pair.token0.id}&currencyIdB=${position.pair.token1.id}`}
            >
              <ButtonLight width="80px" padding="4px 6px" ml="3px">
                <TYPE.small>Remove</TYPE.small>
              </ButtonLight>
            </LinkWrapper>
          )}
        </RowFixed>
      </AutoColumn>

      <AutoColumn gap="12px" justify="flex-end">
        <TYPE.main fontWeight={800}>
          <RowFixed>{formatDollarAmount(valueUSD)}</RowFixed>
        </TYPE.main>
        <AutoColumn gap="4px" justify="flex-end">
          <RowFixed align="flex-end">
            <Label end={1} fontWeight={200}>
              {formatAmount(poolOwnership * parseFloat(position.pair.reserve0))}
            </Label>
            <TYPE.small fontWeight={200} ml="3px">
              {formattedSymbol0}
            </TYPE.small>
          </RowFixed>
          <RowFixed align="flex-end">
            <Label end={1} fontWeight={200}>
              {formatAmount(poolOwnership * parseFloat(position.pair.reserve1))}
            </Label>
            <TYPE.small fontWeight={200} ml="3px">
              {formattedSymbol1}
            </TYPE.small>
          </RowFixed>
        </AutoColumn>
      </AutoColumn>

      <AutoColumn gap="12px" justify="flex-end">
        <TYPE.main color={'green'} fontWeight={800}>
          <RowFixed>{formatDollarAmount(position?.fees.sum)}</RowFixed>
        </TYPE.main>
        <AutoColumn gap="4px" justify="flex-end">
          <RowFixed align="flex-end">
            <Label end={1} fontWeight={200}>
              {parseFloat(position.pair.token0.derivedETH) &&
                formatAmount(position?.fees.sum / (parseFloat(position.pair.token0.derivedETH) * ethPrice) / 2)}
            </Label>
            <TYPE.small fontWeight={200} ml="3px">
              {formattedSymbol0}
            </TYPE.small>
          </RowFixed>
          <RowFixed align="flex-end">
            <Label end={1} fontWeight={200}>
              {parseFloat(position.pair.token1.derivedETH) &&
                formatAmount(position?.fees.sum / (parseFloat(position.pair.token1.derivedETH) * ethPrice) / 2)}
            </Label>
            <TYPE.small fontWeight={200} ml="3px">
              {formattedSymbol1}
            </TYPE.small>
          </RowFixed>
        </AutoColumn>
      </AutoColumn>
    </ResponsiveGrid>
  )
}

const MAX_ITEMS = 5

export default function PositionTable({
  positions,
  maxItems = MAX_ITEMS,
  contentHeight,
  scrollColor,
}: {
  positions: LPReturn[] | undefined
  maxItems?: number
  contentHeight?: string
  scrollColor?: string
}) {
  // theming
  const theme = useTheme()

  const price = useEthPrices()

  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.value)
  const [sortDirection, setSortDirection] = useState<boolean>(true)

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  useEffect(() => {
    let extraPages = 1
    if (positions) {
      if (positions?.length % maxItems === 0) {
        extraPages = 0
      }
      setMaxPage(Math.floor(positions?.length / maxItems) + extraPages)
    }
  }, [maxItems, positions])

  const sortedPositions = useMemo(() => {
    return positions
      ? [...positions]
          .sort((p0, p1) => {
            if (
              p0.coredex &&
              p0.liquidityTokenBalance &&
              p0.pair &&
              p1.coredex &&
              p1.liquidityTokenBalance &&
              p1.pair
            ) {
              if (sortField === SORT_FIELD.coreDexReturn) {
                return p0?.coredex?.return > p1?.coredex?.return ? (sortDirection ? -1 : 1) : sortDirection ? 1 : -1
              }
              if (sortField === SORT_FIELD.value) {
                const bal0 =
                  (parseFloat(p0.liquidityTokenBalance) / parseFloat(p0.pair.totalSupply)) *
                  parseFloat(p0.pair.reserveUSD)
                const bal1 =
                  (parseFloat(p1.liquidityTokenBalance) / parseFloat(p1.pair.totalSupply)) *
                  parseFloat(p1.pair.reserveUSD)
                return bal0 > bal1 ? (sortDirection ? -1 : 1) : sortDirection ? 1 : -1
              }
            }
            return 1
          })
          .slice(MAX_ITEMS * (page - 1), page * MAX_ITEMS)
      : []
  }, [page, positions, sortDirection, sortField])

  const positionData = useMemo(() => {
    return sortedPositions.map((position) => {
      return position.fees && position.pair && position.liquidityTokenBalance
        ? {
            fees: position.fees,
            pair: position.pair,
            liquidityTokenBalance: position.liquidityTokenBalance,
          }
        : undefined
    })
  }, [sortedPositions])

  const handleSort = useCallback(
    (newField: string) => {
      setSortField(newField)
      setSortDirection(sortField !== newField ? true : !sortDirection)
    },
    [sortDirection, sortField]
  )

  const arrow = useCallback(
    (field: string) => {
      return sortField === field ? (!sortDirection ? '↑' : '↓') : ''
    },
    [sortDirection, sortField]
  )

  if (!positions) {
    return <Loader />
  }

  return (
    <Wrapper contentHeight={contentHeight} scrollColor={scrollColor}>
      {sortedPositions.length > 0 ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <Label color={theme.text2}>#</Label>
            <ClickableText color={theme.text2}>Position Name</ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.value)}>
              Liquidity {arrow(SORT_FIELD.value)}
            </ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.coreDexReturn)}>
              Total Fees Earned {arrow(SORT_FIELD.coreDexReturn)}
            </ClickableText>
          </ResponsiveGrid>
          <Break />
          {positionData.map((position, i) => {
            if (position) {
              return (
                <React.Fragment key={i}>
                  {price && (
                    <DataRow index={(page - 1) * MAX_ITEMS + i} position={position} ethPrice={price.currentPrice} />
                  )}
                  <Break />
                </React.Fragment>
              )
            }
            return null
          })}
          <PageButtons>
            <div
              onClick={() => {
                setPage(page === 1 ? page : page - 1)
              }}
            >
              <Arrow faded={page === 1 ? true : false}>←</Arrow>
            </div>
            <TYPE.body>{'Page ' + page + ' of ' + maxPage}</TYPE.body>
            <div
              onClick={() => {
                setPage(page === maxPage ? page : page + 1)
              }}
            >
              <Arrow faded={page === maxPage ? true : false}>→</Arrow>
            </div>
          </PageButtons>
        </AutoColumn>
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
    </Wrapper>
  )
}
