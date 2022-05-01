import { fetchLiquidityChartData } from 'data/user/liquidityChartData'
import { fetchHistoricalPairReturns } from 'data/user/pairPositions'
import { fetchUserPositions } from 'data/user/positionData'
import { fetchUserLPSnapshots } from 'data/user/snapshots'
import { fetchUserTransactions } from 'data/user/transactions'
import { useEthPrices } from 'hooks/useEthPrices'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback, useEffect, useState } from 'react'

import { LPReturn, LPSnapshots, Transaction } from '../../../types'
import { useClients } from '../../application/hooks'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { usePoolDatas } from '../../pools/hooks'
import {
  addUserKeys,
  updateLiquidityChartData,
  updatePositionChartData,
  updatePositions,
  updateSnapshots,
  updateTransactions,
} from './actions'
import { LiquidityChartEntry } from './reducer'

export function useUserSnapshots(): LPSnapshots[] | undefined {
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()
  const user = useAppSelector((state) => state.userChart.byAccount?.[chainId ?? -1])
  const snapshots = user?.snapshots
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      if (!account) return
      const { error, data } = await fetchUserLPSnapshots(account, dataClient)
      if (!error && data && chainId) {
        dispatch(updateSnapshots({ snapshots: data, chainId }))
      }
      if (error) {
        setError(error)
      }
    }
    if (!snapshots && !error && account) {
      fetch()
    }
  }, [account, chainId, dataClient, dispatch, error, snapshots])

  return snapshots
}

export function useUserPotitionChart(position: LPReturn | undefined) {
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()
  const pairAddress = position?.pair?.id
  const [error, setError] = useState(false)
  const { dataClient, blockClient } = useClients()

  const snapshots = useUserSnapshots()
  const pairSnapshots = snapshots
    ? pairAddress
      ? snapshots.filter((currentSnapshot) => {
          return currentSnapshot.pair.id === pairAddress
        })
      : undefined
    : undefined

  const indexPairData = usePoolDatas(pairAddress ? [pairAddress] : [])
  const currentPairData = indexPairData?.[0]
  const price = useEthPrices()

  const user = useAppSelector((state) => state.userChart.byAccount?.[chainId ?? -1])
  const history = pairAddress && user.positionChartData?.[pairAddress]?.history

  useEffect(() => {
    async function fetch() {
      const { data } = await fetchHistoricalPairReturns(
        currentPairData,
        pairSnapshots,
        price?.currentPrice,
        dataClient,
        blockClient
      )
      if (!error && data && chainId && pairAddress) {
        dispatch(updatePositionChartData({ pairAddress, history: data, chainId }))
      }
      if (error) {
        setError(error)
      }
    }
    if (
      account &&
      (!history || history === []) &&
      currentPairData &&
      pairSnapshots &&
      Object.keys(currentPairData).length > 0 &&
      pairAddress &&
      price?.currentPrice
    ) {
      fetch()
    }
  }, [
    account,
    chainId,
    blockClient,
    dataClient,
    error,
    pairSnapshots,
    history,
    pairAddress,
    currentPairData,
    price?.currentPrice,
    dispatch,
    position?.pair?.id,
  ])

  return history
}

export function useAddUserKeys(): () => void {
  const dispatch = useAppDispatch()
  const { chainId } = useActiveWeb3React()

  return useCallback(() => {
    if (chainId) {
      dispatch(addUserKeys({ chainId }))
    }
  }, [chainId, dispatch])
}

export function useUserTransactions(): Transaction[] | undefined {
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()
  const user = useAppSelector((state) => state.userChart.byAccount?.[chainId ?? -1])
  const transactions = user?.transactions
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      if (!account) return
      const { error, data } = await fetchUserTransactions(account, dataClient, chainId)
      if (!error && data && chainId) {
        dispatch(updateTransactions({ transactions: data, chainId }))
      }
      if (error) {
        setError(error)
      }
    }
    if (!transactions && !error) {
      fetch()
    }
  }, [account, chainId, dataClient, dispatch, error, transactions])

  return transactions
}

export function useUserPositions(): LPReturn[] | undefined {
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()
  const user = useAppSelector((state) => state.userChart.byAccount?.[chainId ?? -1])
  const positions = user?.positions
  const [error, setError] = useState(false)
  const price = useEthPrices()
  const snapshots = useUserSnapshots()
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      if (!snapshots || !price || !account) return
      const { error, data } = await fetchUserPositions(account, snapshots, price.currentPrice, dataClient)
      if (!error && data && chainId) {
        dispatch(updatePositions({ positions: data, chainId }))
      }
      if (error) {
        setError(error)
      }
    }
    if (!positions && !error) {
      fetch()
    }
  }, [account, chainId, dataClient, dispatch, error, positions, price, snapshots])

  return positions
}

export function useUserLiquidityChart(): LiquidityChartEntry[] | undefined {
  const dispatch = useAppDispatch()
  const { account, chainId } = useActiveWeb3React()
  const liquidity = useAppSelector((state) => state.userChart.byAccount?.[chainId ?? -1])
  const chartData = liquidity?.liquidityChartData
  const history = useUserSnapshots()
  const [error, setError] = useState(false)
  const { dataClient } = useClients()

  useEffect(() => {
    async function fetch() {
      if (!history || !account) return
      const { error, data } = await fetchLiquidityChartData(account, dataClient, history)
      if (!error && data && chainId) {
        dispatch(updateLiquidityChartData({ liquidityChartData: data, chainId }))
      }
      if (error) {
        setError(error)
      }
    }
    if (!chartData && !error) {
      fetch()
    }
  }, [account, chainId, dispatch, error, chartData, dataClient, history])

  return chartData
}
