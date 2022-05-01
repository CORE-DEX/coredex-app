import { createReducer } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'
import { currentTimestamp } from 'utils/index'

import { ChartDayData, Transaction } from '../../types'
import { updateChartData, updateProtocolData, updateTransactions } from './actions'

export interface ProtocolData {
  // volume
  volumeUSD: number
  volumeUSDChange: number

  // in range liquidity
  tvlUSD: number
  tvlUSDChange: number

  // fees
  feesUSD: number
  feeChange: number

  // transactions
  txCount: number
  txCountChange: number
}

export interface ProtocolState {
  [chainId: string]: {
    // timestamp for last updated fetch
    readonly lastUpdated: number | undefined
    // overview data
    readonly data: ProtocolData | undefined
    readonly chartData: ChartDayData[] | undefined
    readonly transactions: Transaction[] | undefined
  }
}

export const initialState: ProtocolState = {
  [SupportedChainId.MAINNET]: {
    data: undefined,
    chartData: undefined,
    transactions: undefined,
    lastUpdated: undefined,
  },
  [SupportedChainId.ROPSTEN]: {
    data: undefined,
    chartData: undefined,
    transactions: undefined,
    lastUpdated: undefined,
  },
  [SupportedChainId.POLYGON]: {
    data: undefined,
    chartData: undefined,
    transactions: undefined,
    lastUpdated: undefined,
  },
  [SupportedChainId.MUMBAI]: {
    data: undefined,
    chartData: undefined,
    transactions: undefined,
    lastUpdated: undefined,
  },
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateProtocolData, (state, { payload: { protocolData, chainId } }) => {
      state[chainId].data = protocolData
      // mark when last updated
      state[chainId].lastUpdated = currentTimestamp()
    })
    .addCase(updateChartData, (state, { payload: { chartData, chainId } }) => {
      state[chainId].chartData = chartData
    })
    .addCase(updateTransactions, (state, { payload: { transactions, chainId } }) => {
      state[chainId].transactions = transactions
    })
)
