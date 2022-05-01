import { DarkGreyCard } from 'components/Card'
import PoolTable from 'components/pools/PoolTable'
import { ToggleElementFree, ToggleWrapper } from 'components/Toggle'
import TokenTable from 'components/tokens/TokenTable'
import { ETH_USDC_ADDRESS } from 'constants/addresses'
import { CHAIN_INFO } from 'constants/chainInfo'
import { WRAPPED_NATIVE_CURRENCY } from 'constants/tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useActiveWeb3React } from 'hooks/web3'
import { ParsedQs } from 'qs'
import React, { useEffect, useMemo, useState } from 'react'
import { useWindowSize } from 'react-use'
import { usePoolDatas } from 'state/pools/hooks'
import { useAllTokenData, usePoolsForToken, useTokenDatas } from 'state/tokens/hooks'
import { useSavedPools, useSavedTokens } from 'state/user/hooks'
import styled from 'styled-components'
import { notEmpty } from 'utils'

import { TYPE } from '../../theme'
import { PageWrapper } from '../styled'
import Liquidity from './Liquidity'
import PoolChart from './PoolChart'
import Swap from './Swap'
import TokenChart from './TokenChart'

const LIQUIDITY_CARD_MINWIDTH = '370px'
const LIQUIDITY_CARD_WIDTH = '23vw'
const SWAP_HEIGHT = '337px'
const TABLE_HEIGHT = `337px`

const ContentLayout = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  justify-content: space-between;
`

const OrderWrapper = styled.div`
  width: ${`calc(100% - ${LIQUIDITY_CARD_MINWIDTH} - 5px)`};
  height: 84vh;
  margin-right: 5px;
  flex-direction: column;

  @media (max-height: 900px) {
    height: 750px;
  }

  @media (min-width: 1920px) {
    width: calc(100% - ${LIQUIDITY_CARD_WIDTH});
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    height: 100%;
    margin-right: 0;
    margin-bottom: 20px;
  `};
`

const ResponsiveRow = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
  `};
`
/*
  ${({ theme }) => theme.mediaWidth.upToLarge`{
    flex-direction: column;
    row-gap: 1rem;
  `};
  */

const TableWrapper = styled.div<{ marginRight?: string }>`
  width: 50%;
  margin-right: ${({ marginRight }) => (marginRight ? marginRight : '0px')};

  ${({ theme }) => theme.mediaWidth.upToLarge`{
    width: 100%;
    margin-right: 0px;
  `};
`

const SwapWrapper = styled.div`
  width: 50%;

  ${({ theme }) => theme.mediaWidth.upToLarge`{
    display: none;
  `};
`

const LiquidityWrapper = styled.div`
  height: 84vh;

  @media (max-height: 900px) {
    height: 750px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    height: 100%;
  `};
`

const Show1280 = styled.div`
  display: none;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    display: flex;
  `};
`

function windowState(value: boolean[], innerWidth: number, width: number): boolean {
  if (innerWidth <= width) {
    return value[0]
  } else {
    return value[1]
  }
}

export enum RequestType {
  TOKEN,
  POOL,
  NOTHING,
}

enum TableView {
  TOKENS,
  POOLS,
  WATCHLIST,
  SWAP,
}

function useQueryParametersDiscrimination(
  parsedQs: ParsedQs,
  activeNetwork: number | undefined
): { request: RequestType; tokenAddress: string; poolAddress: string } {
  const [tokenAddress, setTokenAddress] = useState<string>(
    WRAPPED_NATIVE_CURRENCY[activeNetwork ?? -1].address.toLowerCase()
  )
  const [poolAddress, setPoolAddress] = useState<string>(ETH_USDC_ADDRESS)
  const [request, setRequest] = useState<RequestType>(RequestType.NOTHING)

  const pool = parsedQs.pool
  const outputCurrency = parsedQs.outputCurrency
  useEffect(() => {
    if (pool === undefined && outputCurrency === undefined) {
      setTokenAddress(WRAPPED_NATIVE_CURRENCY[activeNetwork ?? -1].address.toLowerCase())
      setRequest(RequestType.NOTHING)
    } else if (pool && outputCurrency === undefined) {
      setPoolAddress(pool.toString().toLowerCase())
      setRequest(RequestType.POOL)
    } else if (outputCurrency) {
      setTokenAddress(outputCurrency.toString().toLowerCase())
      setRequest(RequestType.TOKEN)
    }
  }, [pool, outputCurrency, activeNetwork, poolAddress, tokenAddress])

  return { request, tokenAddress, poolAddress }
}

export default function OrderPage() {
  const { chainId } = useActiveWeb3React()
  const activeNetwork = CHAIN_INFO[chainId ?? -1]
  const [requestType, setRequestType] = useState(RequestType.TOKEN)
  const parsedQs = useParsedQueryString()
  const { request, tokenAddress, poolAddress } = useQueryParametersDiscrimination(parsedQs, chainId)

  useEffect(() => {
    setRequestType(request)
  }, [request])

  // scroll on page view
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // token data
  const allTokens = useAllTokenData()
  const formattedTokens = useMemo(() => {
    return Object.values(allTokens)
      .map((t) => t.data)
      .filter(notEmpty)
  }, [allTokens])

  const poolsForToken = usePoolsForToken(tokenAddress)
  const poolDatas = usePoolDatas(poolsForToken ?? [])

  //watchlist
  const [savedTokens] = useSavedTokens()
  const [savedPools] = useSavedPools()
  const watchListTokens = useTokenDatas(savedTokens)
  const watchListPools = usePoolDatas(savedPools)

  const [tableView, setTableView] = useState(requestType === RequestType.POOL ? TableView.TOKENS : TableView.POOLS)

  const { width: innerWidth } = useWindowSize()
  const [smallOrder, setSmallOrder] = useState(windowState([true, false], innerWidth, 1280))
  useEffect(() => {
    setSmallOrder(windowState([true, false], innerWidth, 1280))
  }, [innerWidth])

  useEffect(() => {
    if (smallOrder) {
      setTableView(TableView.SWAP)
    } else {
      setTableView(requestType === RequestType.POOL ? TableView.TOKENS : TableView.POOLS)
    }
  }, [requestType, smallOrder])

  return (
    <PageWrapper>
      <ResponsiveRow>
        <OrderWrapper>
          {requestType === RequestType.POOL ? (
            <PoolChart address={poolAddress} activeNetwork={activeNetwork} smallOrder={smallOrder} />
          ) : (
            <TokenChart address={tokenAddress} activeNetwork={activeNetwork} smallOrder={smallOrder} />
          )}
          <ContentLayout>
            <TableWrapper marginRight="5px">
              <ToggleWrapper width="100%" marginBottom="5px">
                <ToggleElementFree
                  isActive={
                    requestType === RequestType.POOL ? tableView === TableView.TOKENS : tableView === TableView.POOLS
                  }
                  fontSize="16px"
                  onClick={() =>
                    requestType === RequestType.POOL
                      ? tableView === TableView.TOKENS
                        ? setTableView(TableView.WATCHLIST)
                        : setTableView(TableView.TOKENS)
                      : tableView === TableView.POOLS
                      ? setTableView(TableView.WATCHLIST)
                      : setTableView(TableView.POOLS)
                  }
                >
                  {requestType === RequestType.POOL ? 'Top Tokens' : 'Related Pools'}
                </ToggleElementFree>
                <ToggleElementFree
                  isActive={tableView === TableView.WATCHLIST}
                  fontSize="16px"
                  onClick={() =>
                    tableView === TableView.WATCHLIST
                      ? setTableView(TableView.POOLS)
                      : setTableView(TableView.WATCHLIST)
                  }
                >
                  {requestType === RequestType.POOL ? 'Pools Watchlist' : 'Tokens Watchlist'}
                </ToggleElementFree>
                {smallOrder ? (
                  <ToggleElementFree
                    isActive={tableView === TableView.SWAP}
                    fontSize="16px"
                    onClick={() =>
                      tableView === TableView.SWAP ? setTableView(TableView.WATCHLIST) : setTableView(TableView.SWAP)
                    }
                  >
                    Swap
                  </ToggleElementFree>
                ) : null}
              </ToggleWrapper>
              {requestType === RequestType.POOL ? (
                tableView === TableView.TOKENS ? (
                  <TokenTable
                    tokenDatas={formattedTokens}
                    maxItems={5}
                    contentHeight={TABLE_HEIGHT}
                    scrollColor={activeNetwork.scrollColor}
                    shortName={true}
                  />
                ) : tableView === TableView.WATCHLIST ? (
                  <>
                    {savedPools.length > 0 ? (
                      <PoolTable
                        poolDatas={watchListPools}
                        maxItems={5}
                        contentHeight={TABLE_HEIGHT}
                        scrollColor={activeNetwork.scrollColor}
                        shortName={true}
                      />
                    ) : (
                      <DarkGreyCard padding="10px">
                        <TYPE.main>Saved pools will appear here</TYPE.main>
                      </DarkGreyCard>
                    )}
                  </>
                ) : null
              ) : requestType === RequestType.TOKEN || RequestType.NOTHING ? (
                tableView === TableView.POOLS ? (
                  <PoolTable
                    poolDatas={poolDatas}
                    maxItems={5}
                    contentHeight={TABLE_HEIGHT}
                    scrollColor={activeNetwork.scrollColor}
                    shortName={true}
                  />
                ) : tableView === TableView.WATCHLIST ? (
                  <>
                    {savedTokens.length > 0 ? (
                      <TokenTable
                        tokenDatas={watchListTokens}
                        maxItems={5}
                        contentHeight={TABLE_HEIGHT}
                        scrollColor={activeNetwork.scrollColor}
                        shortName={true}
                      />
                    ) : (
                      <DarkGreyCard padding="10px">
                        <TYPE.main>Saved tokens will appear here</TYPE.main>
                      </DarkGreyCard>
                    )}
                  </>
                ) : null
              ) : null}
              {tableView === TableView.SWAP ? <Swap height={SWAP_HEIGHT} /> : null}
            </TableWrapper>
            <SwapWrapper>{smallOrder ? null : <Swap height={SWAP_HEIGHT} />}</SwapWrapper>
          </ContentLayout>
        </OrderWrapper>

        <LiquidityWrapper>
          <Liquidity activeNetwork={activeNetwork} width={LIQUIDITY_CARD_WIDTH} minWidth={LIQUIDITY_CARD_MINWIDTH} />
        </LiquidityWrapper>
      </ResponsiveRow>
    </PageWrapper>
  )
}
