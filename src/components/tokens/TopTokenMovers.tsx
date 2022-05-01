import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAllTokenData } from 'state/tokens/hooks'
import { TokenData } from 'state/tokens/reducer'
import styled from 'styled-components'
import { formatDollarAmount } from 'utils/numbers'

import { StyledInternalLink, TYPE } from '../../theme'
import { GreyCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import HoverInlineText from '../HoverInlineText'
import Percent from '../Percent'
import { RowFixed, RowFlat } from '../Row'

const CardWrapper = styled(StyledInternalLink)`
  min-width: 190px;
  margin-right: 16px;

  :hover {
    cursor: pointer;
    opacity: 0.6;
  }
`

const FixedContainer = styled(AutoColumn)``

export const ScrollableRow = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  overflow-x: auto;
  white-space: nowrap;

  ::-webkit-scrollbar {
    display: none;
  }
`

const DataCard = ({ tokenData }: { tokenData: TokenData }) => {
  return (
    <CardWrapper to={'order?outputCurrency=' + tokenData.address}>
      <GreyCard padding="16px">
        <RowFixed>
          <CurrencyLogo address={tokenData.address} size="32px" />
          <AutoColumn gap="3px" style={{ marginLeft: '12px' }}>
            <TYPE.label fontSize="14px">
              <HoverInlineText text={tokenData.symbol} />
            </TYPE.label>
            <RowFlat>
              <TYPE.label fontSize="14px" mr="6px" lineHeight="16px">
                {formatDollarAmount(tokenData.priceUSD)}
              </TYPE.label>
              <Percent fontSize="14px" value={tokenData.priceUSDChange} />
            </RowFlat>
          </AutoColumn>
        </RowFixed>
      </GreyCard>
    </CardWrapper>
  )
}

export default function TopTokenMovers() {
  const allTokens = useAllTokenData()

  const topPriceIncrease = useMemo(() => {
    return Object.values(allTokens)
      .sort(({ data: a }, { data: b }) => {
        return a && b ? (Math.abs(a?.priceUSDChange) > Math.abs(b?.priceUSDChange) ? -1 : 1) : -1
      })
      .slice(0, Math.min(20, Object.values(allTokens).length))
  }, [allTokens])

  const increaseRef = useRef<HTMLDivElement>(null)
  const [increaseSet, setIncreaseSet] = useState(false)

  useEffect(() => {
    if (!increaseSet && increaseRef && increaseRef.current) {
      setInterval(() => {
        if (increaseRef.current && increaseRef.current.scrollLeft !== increaseRef.current.scrollWidth) {
          increaseRef.current.scrollTo(increaseRef.current.scrollLeft + 1, 0)
        }
      }, 30)
      setIncreaseSet(true)
    }
  }, [increaseRef, increaseSet])

  return (
    <FixedContainer gap="md">
      <ScrollableRow ref={increaseRef}>
        {topPriceIncrease.map((entry) =>
          entry.data ? <DataCard key={'top-card-token-' + entry.data?.address} tokenData={entry.data} /> : null
        )}
      </ScrollableRow>
    </FixedContainer>
  )
}
