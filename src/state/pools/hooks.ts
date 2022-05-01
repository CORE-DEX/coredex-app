import { fetchPoolChartData } from 'data/pools/chartData'
import { fetchHourlyData } from 'data/pools/hourlyData'
import { fetchPoolTransactions } from 'data/pools/transactions'
import dayjs, { OpUnitType } from 'dayjs'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useState } from 'react'

import { PriceChartEntry, Transaction } from '../../types'
import { notEmpty } from '../../utils'
import { useClients } from '../application/hooks'
import { useAppDispatch, useAppSelector } from '../hooks'
import { addPoolKeys, updataPoolHoulyRates, updatePoolChartData, updatePoolTransactions } from './actions'
import { updatePoolData } from './actions'
import { PoolChartEntry, PoolData } from './reducer'

export function useAllPoolData(): {
  [address: string]: { data: PoolData | undefined; lastUpdated: number | undefined }
} {
  const { chainId } = useActiveWeb3React()
  return useAppSelector((state) => state.pools.byAddress[chainId ?? -1] ?? {})
}

export function useUpdatePoolData(): (pools: PoolData[]) => void {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  return useCallback(
    (pools: PoolData[]) => chainId && dispatch(updatePoolData({ pools, chainId })),
    [dispatch, chainId]
  )
}

export function useAddPoolKeys(): (addresses: string[]) => void {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  return useCallback(
    (poolAddresses: string[]) => chainId && dispatch(addPoolKeys({ poolAddresses, chainId })),
    [dispatch, chainId]
  )
}

export function usePoolDatas(poolAddresses: string[]): PoolData[] {
  const allPoolData = useAllPoolData()
  const addPoolKeys = useAddPoolKeys()

  const untrackedAddresses = poolAddresses.reduce((accum: string[], address) => {
    if (!Object.keys(allPoolData).includes(address)) {
      accum.push(address)
    }
    return accum
  }, [])

  useEffect(() => {
    if (untrackedAddresses) {
      addPoolKeys(untrackedAddresses)
    }
    return
  }, [addPoolKeys, untrackedAddresses])

  // filter for pools with data
  const poolsWithData = poolAddresses
    .map((address) => {
      const poolData = allPoolData[address]?.data
      return poolData ?? undefined
    })
    .filter(notEmpty)

  return poolsWithData
}

/**
 * Get top pools addresses that token is included in
 * If not loaded, fetch and store
 * @param address
 */
export function usePoolChartData(address: string): PoolChartEntry[] | undefined {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()

  const pool = useAppSelector((state) => state.pools.byAddress[chainId ?? -1]?.[address])
  const chartData = pool?.chartData
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      const { error, data } = await fetchPoolChartData(address, dataClient)
      if (!error && data && chainId) {
        dispatch(updatePoolChartData({ poolAddress: address, chartData: data, chainId }))
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

export function usePoolHourlyRates(
  address: string,
  interval: number,
  timeWindow: OpUnitType
): {
  rate0: PriceChartEntry[] | undefined
  rate1: PriceChartEntry[] | undefined
} {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const [error, setError] = useState(false)
  const { dataClient, blockClient } = useClients()
  const hourlyRates = useAppSelector((state) => state.pools.byAddress[chainId ?? -1]?.[address])
  const hourlyData = hourlyRates.hourlyData[interval]
  const oldestTimestampFetched = hourlyRates.hourlyData.oldestFetchedTimestamp

  const utcCurrentTime = dayjs()
  const startTimestamp = utcCurrentTime.subtract(1, timeWindow).startOf('hour').unix()

  useEffect(() => {
    async function fetch() {
      const { data, error: fetchingError } = await fetchHourlyData(
        address,
        startTimestamp,
        interval,
        dataClient,
        blockClient
      )
      if (data && chainId) {
        dispatch(
          updataPoolHoulyRates({
            poolAddress: address,
            secondsInterval: interval,
            hourlyData: data,
            oldestFetchedTimestamp: startTimestamp,
            chainId,
          })
        )
      }
      if (fetchingError) {
        setError(true)
      }
    }
    if (!hourlyData && !error) {
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
    hourlyData,
    startTimestamp,
    timeWindow,
  ])

  return {
    rate0: hourlyData?.rate0,
    rate1: hourlyData?.rate1,
  }
}

/**
 * Get all transactions on pool
 * @param address
 */
export function usePoolTransactions(address: string): Transaction[] | undefined {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()
  const pool = useAppSelector((state) => state.pools.byAddress[chainId ?? -1]?.[address])
  const transactions = pool?.transactions
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      const { error, data } = await fetchPoolTransactions([address], dataClient, chainId)
      if (error) {
        setError(true)
      } else if (data && chainId) {
        dispatch(updatePoolTransactions({ poolAddress: address, transactions: data, chainId }))
      }
    }
    if (!transactions && !error) {
      fetch()
    }
  }, [chainId, address, dispatch, error, transactions, dataClient])

  // return data
  return transactions
}
