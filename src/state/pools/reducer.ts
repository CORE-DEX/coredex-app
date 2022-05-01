import { createReducer } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'
import { currentTimestamp } from 'utils/index'

import { PriceChartEntry, Transaction } from '../../types'
import { SerializedToken } from '../user/actions'
import {
  addPoolKeys,
  updataPoolHoulyRates,
  updatePoolChartData,
  updatePoolData,
  updatePoolTransactions,
} from './actions'

export interface Pool {
  address: string
  token0: SerializedToken
  token1: SerializedToken
}

export interface PoolData {
  // basic token info
  address: string
  fees: number

  token0: {
    name: string
    symbol: string
    address: string
    derivedETH: number
  }

  token1: {
    name: string
    symbol: string
    address: string
    derivedETH: number
  }

  reserve0: number
  reserve1: number
  reserveUSD: number

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number

  volumeUntracked: number
  volumeUntrackedWeek: number
  volumeUntrackedChange: number

  // liquidity
  tvlUSD: number
  tvlUSDChange: number

  trackedReserveUSD: number
  liquidityUSDChange: number

  totalSupply: number

  createdAtTimestamp: number

  // prices
  token0Price: number
  token1Price: number
}

export type PoolChartEntry = {
  date: number
  dailyVolumeUSD: number
  reserveUSD: number
}

export interface PoolsState {
  // analytics data from
  byAddress: {
    [chainId: string]: {
      [address: string]: {
        data: PoolData | undefined
        chartData: PoolChartEntry[] | undefined
        transactions: Transaction[] | undefined
        lastUpdated: number | undefined
        hourlyData: {
          [secondsInterval: number]: {
            rate0: PriceChartEntry[] | undefined
            rate1: PriceChartEntry[] | undefined
          }
          oldestFetchedTimestamp?: number | undefined
        }
      }
    }
  }
}

export const initialState: PoolsState = {
  byAddress: {
    [SupportedChainId.MAINNET]: {},
    [SupportedChainId.ROPSTEN]: {},
    [SupportedChainId.POLYGON]: {},
    [SupportedChainId.MUMBAI]: {},
  },
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updatePoolData, (state, { payload: { pools, chainId } }) => {
      pools.map(
        (poolData) =>
          (state.byAddress[chainId][poolData.address] = {
            ...state.byAddress[chainId][poolData.address],
            data: poolData,
            lastUpdated: currentTimestamp(),
          })
      )
    })
    // add address to byAddress keys if not included yet
    .addCase(addPoolKeys, (state, { payload: { poolAddresses, chainId } }) => {
      poolAddresses.map((address) => {
        if (!state.byAddress[chainId][address]) {
          state.byAddress[chainId][address] = {
            data: undefined,
            chartData: undefined,
            transactions: undefined,
            lastUpdated: undefined,
            hourlyData: {},
          }
        }
      })
    })
    .addCase(updatePoolChartData, (state, { payload: { poolAddress, chartData, chainId } }) => {
      state.byAddress[chainId][poolAddress] = { ...state.byAddress[chainId][poolAddress], chartData: chartData }
    })
    .addCase(updatePoolTransactions, (state, { payload: { poolAddress, transactions, chainId } }) => {
      state.byAddress[chainId][poolAddress] = { ...state.byAddress[chainId][poolAddress], transactions }
    })
    .addCase(updataPoolHoulyRates, (state, { payload: { poolAddress, secondsInterval, hourlyData, chainId } }) => {
      state.byAddress[chainId][poolAddress] = {
        ...state.byAddress[chainId][poolAddress],
        hourlyData: {
          ...state.byAddress[chainId][poolAddress].hourlyData,
          [secondsInterval]: hourlyData,
        },
      }
    })
)
