import { useFetchAggregateProtocolData } from 'data/protocol/overview'
import { useActiveWeb3React } from 'hooks/web3'
import { useCallback } from 'react'

import { ChartDayData, Transaction } from '../../types'
import { useAppDispatch, useAppSelector } from '../hooks'
import { updateChartData, updateProtocolData, updateTransactions } from './actions'
import { ProtocolData } from './reducer'

export function useProtocolData(): [ProtocolData | undefined, (protocolData: ProtocolData) => void] {
  const { chainId } = useActiveWeb3React()
  const protocolData: ProtocolData | undefined = useAppSelector((state) => state.protocol[chainId ?? -1]?.data)

  const dispatch = useAppDispatch()
  const setProtocolData: (protocolData: ProtocolData) => void = useCallback(
    (protocolData: ProtocolData) => chainId && dispatch(updateProtocolData({ protocolData, chainId })),
    [chainId, dispatch]
  )
  return [protocolData, setProtocolData]
}

export function useProtocolChartData(): [ChartDayData[] | undefined, (chartData: ChartDayData[]) => void] {
  const { chainId } = useActiveWeb3React()
  const chartData: ChartDayData[] | undefined = useAppSelector((state) => state.protocol[chainId ?? -1]?.chartData)

  const dispatch = useAppDispatch()
  const setChartData: (chartData: ChartDayData[]) => void = useCallback(
    (chartData: ChartDayData[]) => chainId && dispatch(updateChartData({ chartData, chainId })),
    [chainId, dispatch]
  )
  return [chartData, setChartData]
}

export function useProtocolTransactions(): [Transaction[] | undefined, (transactions: Transaction[]) => void] {
  const { chainId } = useActiveWeb3React()
  const transactions: Transaction[] | undefined = useAppSelector((state) => state.protocol[chainId ?? -1]?.transactions)
  const dispatch = useAppDispatch()
  const setTransactions: (transactions: Transaction[]) => void = useCallback(
    (transactions: Transaction[]) => chainId && dispatch(updateTransactions({ transactions, chainId })),
    [chainId, dispatch]
  )
  return [transactions, setTransactions]
}

export function useAggregateOverviewData() {
  useFetchAggregateProtocolData()
}
