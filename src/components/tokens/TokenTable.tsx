import { TOKEN_HIDE } from 'constants/addresses'
import useTheme from 'hooks/useTheme'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TokenData } from 'state/tokens/reducer'
import styled from 'styled-components'
import { formatDollarAmount } from 'utils/numbers'

import { ExtraSmallOnly, HideExtraSmall, TYPE } from '../../theme'
import { DarkGreyCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import HoverInlineText from '../HoverInlineText'
import Loader, { LoadingRows } from '../Loader'
import Percent from '../Percent'
import { RowFixed } from '../Row'
import { Arrow, Break, PageButtons } from '../shared'
import { ClickableText, Label } from '../Text'

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

  grid-template-columns: 20px 3.5fr repeat(4, 1fr);

  @media screen and (max-width: 1400px) {
    grid-template-columns: 20px 3.5fr repeat(3, 1fr);
    & :nth-child(4) {
      display: none;
    }
  }

  @media screen and (max-width: 1250px) {
    grid-template-columns: 20px 3.5fr repeat(2, 1fr);
    & :nth-child(6) {
      display: none;
    }
  }

  @media screen and (max-width: 1080px) {
    grid-template-columns: 2px 3.5fr repeat(1, 1fr);
    & :nth-child(5) {
      display: none;
    }
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 20px 3.5fr repeat(3, 1fr);
    & :nth-child(4) {
      display: none;
    }
    & :nth-child(6) {
      display: grid;
    }
    & :nth-child(5) {
      display: grid;
    }
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: 2.5fr repeat(1, 1fr);
      > *:first-child {
        display: none;
      }
      & :nth-child(6) {
        display: none;
      }
      & :nth-child(5) {
        display: none;
      }
  `};
`

const LinkWrapper = styled(Link)`
  text-decoration: none;
  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

const ResponsiveLogo = styled(CurrencyLogo)`
  @media screen and (max-width: 670px) {
    width: 16px;
    height: 16px;
  }
`

const DataRow = ({ tokenData, index, shortName }: { tokenData: TokenData; index: number; shortName?: boolean }) => {
  const theme = useTheme()
  return (
    <LinkWrapper to={`order?outputCurrency=${tokenData.address}`}>
      <ResponsiveGrid>
        <Label>{index + 1}</Label>
        <Label>
          <RowFixed>
            <ResponsiveLogo address={tokenData.address} />
          </RowFixed>
          <ExtraSmallOnly style={{ marginLeft: '6px' }}>
            <Label ml="8px">{tokenData.symbol}</Label>
          </ExtraSmallOnly>
          <HideExtraSmall style={shortName ? { marginLeft: '10px' } : { marginLeft: '10px' }}>
            {shortName ? (
              <Label ml="8px">{tokenData.symbol}</Label>
            ) : (
              <RowFixed>
                <HoverInlineText text={tokenData.name} />
                <Label ml="8px" color={theme.text3}>
                  ({tokenData.symbol})
                </Label>
              </RowFixed>
            )}
          </HideExtraSmall>
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(tokenData.priceUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          <Percent value={tokenData.priceUSDChange} fontWeight={400} />
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(tokenData.volumeUSD)}
        </Label>
        <Label end={1} fontWeight={400}>
          {formatDollarAmount(tokenData.tvlUSD)}
        </Label>
      </ResponsiveGrid>
    </LinkWrapper>
  )
}

const SORT_FIELD = {
  name: 'name',
  volumeUSD: 'volumeUSD',
  tvlUSD: 'tvlUSD',
  priceUSD: 'priceUSD',
  priceUSDChange: 'priceUSDChange',
  priceUSDChangeWeek: 'priceUSDChangeWeek',
}

const MAX_ITEMS = 10

export default function TokenTable({
  tokenDatas,
  maxItems = MAX_ITEMS,
  contentHeight,
  scrollColor,
  shortName,
}: {
  tokenDatas: TokenData[] | undefined
  maxItems?: number
  contentHeight?: string
  scrollColor?: string
  shortName?: boolean
}) {
  // theming
  const theme = useTheme()

  // for sorting
  const [sortField, setSortField] = useState(SORT_FIELD.tvlUSD)
  const [sortDirection, setSortDirection] = useState<boolean>(true)

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  useEffect(() => {
    let extraPages = 1
    if (tokenDatas) {
      if (tokenDatas.length % maxItems === 0) {
        extraPages = 0
      }
      setMaxPage(Math.floor(tokenDatas.length / maxItems) + extraPages)
    }
  }, [maxItems, tokenDatas])

  const sortedTokens = useMemo(() => {
    return tokenDatas
      ? tokenDatas
          .filter((x) => !!x && !TOKEN_HIDE.includes(x.address))
          .sort((a, b) => {
            if (a && b) {
              return a[sortField as keyof TokenData] > b[sortField as keyof TokenData]
                ? (sortDirection ? -1 : 1) * 1
                : (sortDirection ? -1 : 1) * -1
            } else {
              return -1
            }
          })
          .slice(maxItems * (page - 1), page * maxItems)
      : []
  }, [tokenDatas, maxItems, page, sortDirection, sortField])

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

  if (!tokenDatas) {
    return <Loader />
  }

  return (
    <Wrapper contentHeight={contentHeight} scrollColor={scrollColor}>
      {sortedTokens.length > 0 ? (
        <AutoColumn gap="16px">
          <ResponsiveGrid>
            <Label color={theme.text2}>#</Label>
            <ClickableText color={theme.text2} onClick={() => handleSort(SORT_FIELD.name)}>
              Name {arrow(SORT_FIELD.name)}
            </ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.priceUSD)}>
              Price {arrow(SORT_FIELD.priceUSD)}
            </ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.priceUSDChange)}>
              {shortName ? 'Change ' : 'Price Change '}
              {arrow(SORT_FIELD.priceUSDChange)}
            </ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.volumeUSD)}>
              {shortName ? 'Vol 24H ' : 'Volume 24H '}
              {arrow(SORT_FIELD.volumeUSD)}
            </ClickableText>
            <ClickableText color={theme.text2} end={1} onClick={() => handleSort(SORT_FIELD.tvlUSD)}>
              TVL {arrow(SORT_FIELD.tvlUSD)}
            </ClickableText>
          </ResponsiveGrid>

          <Break />
          {sortedTokens.map((data, i) => {
            if (data) {
              return (
                <React.Fragment key={i}>
                  <DataRow index={(page - 1) * MAX_ITEMS + i} tokenData={data} shortName={shortName} />
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
