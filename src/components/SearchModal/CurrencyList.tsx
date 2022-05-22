import { Currency, CurrencyAmount, Token } from '@cocore/swap-sdk'
import TokenListLogo from 'assets/svg/tokenlist.svg'
import { useIsUserAddedToken } from 'hooks/Tokens'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks/web3'
import React, { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useCombinedActiveList } from 'state/lists/hooks'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useCurrencyBalance } from 'state/wallet/hooks'
import styled from 'styled-components/macro'

import { TYPE } from '../../theme'
import { isTokenOnList } from '../../utils'
import { LightGreyCard } from '../Card'
import Column from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import Loader from '../Loader'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import { MouseoverTooltip } from '../Tooltip'
import ImportRow from './ImportRow'
import { MenuItem } from './styleds'

function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ETHER'
}

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.bg3};
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  padding: 0.25rem 0.3rem 0.25rem 0.3rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: flex-end;
  margin-right: 4px;
`

const FixedContentRow = styled.div`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-gap: 16px;
  align-items: center;
`

const FixedSizeListWrapper = styled(FixedSizeList)<{ scrollColor?: string }>`
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

function Balance({ balance }: { balance: CurrencyAmount<Currency> }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(4)}</StyledBalanceText>
}

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

const TokenListLogoWrapper = styled.img`
  height: 20px;
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof WrappedTokenInfo)) {
    return <span />
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) return <span />

  const tag = tags[0]

  return (
    <TagContainer>
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </TagContainer>
  )
}

function CurrencyRow({
  currency,
  onSelect,
  isSelected,
  otherSelected,
  style,
  showCurrencyAmount,
}: {
  currency: Currency
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
  showCurrencyAmount?: boolean
}) {
  const { account } = useActiveWeb3React()
  const key = currencyKey(currency)
  const selectedTokenList = useCombinedActiveList()
  const isOnSelectedList = isTokenOnList(selectedTokenList, currency.isToken ? currency : undefined)
  const customAdded = useIsUserAddedToken(currency)
  const balance = useCurrencyBalance(account ?? undefined, currency)

  // only show add or remove buttons if not on selected list
  return (
    <MenuItem
      style={style}
      className={`token-item-${key}`}
      onClick={() => (isSelected ? null : onSelect())}
      disabled={isSelected}
      selected={otherSelected}
    >
      <CurrencyLogo currency={currency} size={'24px'} />
      <Column>
        <Text title={currency.name} fontWeight={500}>
          {currency.symbol}
        </Text>
        <TYPE.darkGray ml="0px" fontSize={'12px'} fontWeight={300}>
          {!currency.isNative && !isOnSelectedList && customAdded ? (
            <Text>{currency.name} • Added by user</Text>
          ) : (
            currency.name
          )}
        </TYPE.darkGray>
      </Column>
      <TokenTags currency={currency} />
      {showCurrencyAmount && (
        <RowFixed style={{ justifySelf: 'flex-end' }}>
          {balance ? <Balance balance={balance} /> : account ? <Loader /> : null}
        </RowFixed>
      )}
    </MenuItem>
  )
}

const BREAK_LINE = 'BREAK'
type BreakLine = typeof BREAK_LINE
function isBreakLine(x: unknown): x is BreakLine {
  return x === BREAK_LINE
}

function BreakLineComponent({ style }: { style: CSSProperties }) {
  const theme = useTheme()
  return (
    <FixedContentRow style={style}>
      <LightGreyCard padding="8px 12px">
        <RowBetween>
          <RowFixed>
            <TokenListLogoWrapper src={TokenListLogo} />
            <TYPE.main ml="6px" fontSize="12px" color={theme.text1}>
              Expanded results from inactive Token Lists
            </TYPE.main>
          </RowFixed>
          <QuestionHelper
            text={'Tokens from inactive lists. Import specific tokens below or click Manage to activate more lists.'}
          />
        </RowBetween>
      </LightGreyCard>
    </FixedContentRow>
  )
}

export default function CurrencyList({
  height,
  currencies,
  otherListTokens,
  selectedCurrency,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showImportView,
  setImportToken,
  showCurrencyAmount,
  scrollColor,
}: {
  height: number
  currencies: Currency[]
  otherListTokens?: WrappedTokenInfo[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showImportView: () => void
  setImportToken: (token: Token) => void
  showCurrencyAmount?: boolean
  scrollColor?: string
}) {
  const itemData: (Currency | BreakLine)[] = useMemo(() => {
    if (otherListTokens && otherListTokens?.length > 0) {
      return [...currencies, BREAK_LINE, ...otherListTokens]
    }
    return currencies
  }, [currencies, otherListTokens])

  const Row = useCallback(
    function TokenRow({ data, index, style }) {
      const row: Currency | BreakLine = data[index]

      if (isBreakLine(row)) {
        return <BreakLineComponent style={style} />
      }

      const currency = row

      const isSelected = Boolean(currency && selectedCurrency && selectedCurrency.equals(currency))
      const otherSelected = Boolean(currency && otherCurrency && otherCurrency.equals(currency))
      const handleSelect = () => currency && onCurrencySelect(currency)

      const token = currency?.wrapped

      const showImport = index > currencies.length

      if (showImport && token) {
        return (
          <ImportRow style={style} token={token} showImportView={showImportView} setImportToken={setImportToken} dim />
        )
      } else if (currency) {
        return (
          <CurrencyRow
            style={style}
            currency={currency}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
            showCurrencyAmount={showCurrencyAmount}
          />
        )
      } else {
        return null
      }
    },
    [
      currencies.length,
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      setImportToken,
      showImportView,
      showCurrencyAmount,
    ]
  )

  const itemKey = useCallback((index: number, data: typeof itemData) => {
    const currency = data[index]
    if (isBreakLine(currency)) return BREAK_LINE
    return currencyKey(currency)
  }, [])

  return (
    <FixedSizeList
      height={height}
      ref={fixedListRef as any}
      width="100%"
      itemData={itemData}
      itemCount={itemData.length}
      itemSize={56}
      itemKey={itemKey}
    >
      {Row}
    </FixedSizeList>
  )
}
