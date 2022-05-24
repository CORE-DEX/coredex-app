import { fetchTokenChartData } from 'data/tokens/chartData'
import { fetchPoolsForToken } from 'data/tokens/poolsForToken'
import { fetchTokenPriceData } from 'data/tokens/priceData'
import { fetchTokenTransactions } from 'data/tokens/transactions'
import dayjs, { OpUnitType } from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { isAddress } from 'ethers/lib/utils'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { PriceChartEntry, Transaction } from '../../types'
import { notEmpty } from '../../utils'
import { useClients } from '../application/hooks'
import { useAppDispatch, useAppSelector } from '../hooks'
import { useAllPoolData } from '../pools/hooks'
import {
  addPoolAddresses,
  addTokenKeys,
  updateChartData,
  updatePriceData,
  updateTokenData,
  updateTransactions,
} from './actions'
import { TokenChartEntry, TokenData } from './reducer'
// format dayjs with the libraries that we need
dayjs.extend(utc)

export function useAllTokenData(): {
  [address: string]: { data: TokenData | undefined; lastUpdated: number | undefined }
} {
  const { chainId } = useActiveWeb3React()
  return useAppSelector((state) => state.tokens.byAddress[chainId ?? -1] ?? {})
}

export function useUpdateTokenData(): (tokens: TokenData[]) => void {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()

  return useCallback(
    (tokens: TokenData[]) => {
      chainId && dispatch(updateTokenData({ tokens, chainId }))
    },
    [chainId, dispatch]
  )
}

export function useAddTokenKeys(): (addresses: string[]) => void {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  return useCallback(
    (tokenAddresses: string[]) => chainId && dispatch(addTokenKeys({ tokenAddresses, chainId })),
    [chainId, dispatch]
  )
}

export function useTokenDatas(addresses: string[] | undefined): TokenData[] | undefined {
  const allTokenData = useAllTokenData()
  const addTokenKeys = useAddTokenKeys()

  // if token not tracked yet track it
  addresses?.map((a) => {
    if (!allTokenData[a]) {
      addTokenKeys([a])
    }
  })

  const data = useMemo(() => {
    if (!addresses) {
      return undefined
    }
    return addresses
      .map((a) => {
        return allTokenData[a]?.data
      })
      .filter(notEmpty)
  }, [addresses, allTokenData])

  return data
}

export function useTokenData(address: string | undefined): TokenData | undefined {
  const allTokenData = useAllTokenData()
  const addTokenKeys = useAddTokenKeys()

  // if invalid address return
  if (!address || !isAddress(address)) {
    return undefined
  }

  // if token not tracked yet track it
  if (!allTokenData[address]) {
    addTokenKeys([address])
  }

  // return data
  return allTokenData[address]?.data
}

/**
 * Get top pools addresses that token is included in
 * If not loaded, fetch and store
 * @param address
 */
export function usePoolsForToken(address: string): string[] | undefined {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const token = useAppSelector((state) => state.tokens.byAddress[chainId ?? -1]?.[address])
  const poolsForToken = token?.poolAddresses
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      const { loading, error, addresses } = await fetchPoolsForToken(address, dataClient)
      if (!loading && !error && addresses && chainId) {
        dispatch(addPoolAddresses({ tokenAddress: address, poolAddresses: addresses, chainId }))
      }
      if (error) {
        setError(error)
      }
    }
    if (!poolsForToken && !error) {
      fetch()
    }
  }, [chainId, address, dispatch, error, poolsForToken, dataClient])

  // return data
  return poolsForToken
}

/**
 * Get top pools addresses that token is included in
 * If not loaded, fetch and store
 * @param address
 */
export function useTokenChartData(address: string): TokenChartEntry[] | undefined {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const token = useAppSelector((state) => state.tokens.byAddress[chainId ?? -1]?.[address])
  const chartData = token?.chartData
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      const { error, data } = await fetchTokenChartData(address, dataClient)
      if (!error && data && chainId) {
        dispatch(updateChartData({ tokenAddress: address, chartData: data, chainId }))
      }
      if (error) {
        setError(error)
      }
    }
    if (!chartData && !error) {
      fetch()
    }
  }, [chainId, address, dispatch, error, chartData, dataClient])

  // return data
  return chartData
}

/**
 * Get top pools addresses that token is included in
 * If not loaded, fetch and store
 * @param address
 */
export function useTokenPriceData(
  address: string,
  interval: number,
  timeWindow: OpUnitType
): PriceChartEntry[] | undefined {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const token = useAppSelector((state) => state.tokens.byAddress[chainId ?? -1]?.[address])
  const priceData = token?.priceData[interval]
  const [error, setError] = useState(false)
  const { dataClient, blockClient } = useClients()

  // construct timestamps and check if we need to fetch more data
  const oldestTimestampFetched = token.priceData.oldestFetchedTimestamp
  const utcCurrentTime = dayjs()
  const startTimestamp = utcCurrentTime.subtract(1, timeWindow).startOf('hour').unix()

  useEffect(() => {
    async function fetch() {
      const { data, error: fetchingError } = await fetchTokenPriceData(
        address,
        startTimestamp,
        interval,
        dataClient,
        blockClient
      )
      if (data && chainId) {
        dispatch(
          updatePriceData({
            tokenAddress: address,
            secondsInterval: interval,
            priceData: data,
            oldestFetchedTimestamp: startTimestamp,
            chainId,
          })
        )
      }
      if (fetchingError) {
        setError(true)
      }
    }
    if (!priceData && !error) {
      fetch()
    }
  }, [
    chainId,
    address,
    blockClient,
    dataClient,
    dispatch,
    error,
    interval,
    oldestTimestampFetched,
    priceData,
    startTimestamp,
    timeWindow,
  ])

  // return data
  return priceData
}

/**
 * Get top pools addresses that token is included in
 * If not loaded, fetch and store
 * @param address
 */
export function useTokenTransactions(address: string): Transaction[] | undefined {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const token = useAppSelector((state) => state.tokens.byAddress[chainId ?? -1]?.[address])
  const transactions = token?.transactions
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  const allPairs = useAllPoolData()
  const formattedAllPoolData = Object.values(allPairs)

  const relevantTokenPairs = formattedAllPoolData
    .map((p) => {
      if (p.data?.token0.address == address || p.data?.token1.address == address) {
        return p.data.address
      } else {
        return null
      }
    })
    .filter(Boolean)

  useEffect(() => {
    async function fetch() {
      const { data, error } = await fetchTokenTransactions(relevantTokenPairs, dataClient, chainId)
      if (error) {
        setError(true)
      } else if (data && chainId) {
        dispatch(updateTransactions({ tokenAddress: address, transactions: data, chainId }))
      }
    }
    if (!transactions && !error) {
      fetch()
    }
  }, [chainId, address, dataClient, dispatch, error, relevantTokenPairs, transactions])

  return transactions
}
