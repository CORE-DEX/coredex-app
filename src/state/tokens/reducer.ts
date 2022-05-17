import { createReducer } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'
import { currentTimestamp } from 'utils/index'

import { PriceChartEntry, Transaction } from '../../types'
import {
  addPoolAddresses,
  addTokenKeys,
  updateChartData,
  updatePriceData,
  updateTokenData,
  updateTransactions,
} from './actions'

export type TokenData = {
  // token is in some pool on uniswap
  exists: boolean

  // basic token info
  name: string
  symbol: string
  address: string

  // volume
  volumeUSD: number
  volumeUSDChange: number
  volumeUSDWeek: number
  txCount: number

  // tvl
  tvlUSD: number
  tvlUSDChange: number

  priceUSD: number
  priceUSDChange: number

  oneDayVolumeUT: number
}

export interface TokenChartEntry {
  date: number
  volumeUSD: number
  totalValueLockedUSD: number
}

export interface TokensState {
  // analytics data from
  byAddress: {
    [chainId: string]: {
      [address: string]: {
        data: TokenData | undefined
        poolAddresses: string[] | undefined
        chartData: TokenChartEntry[] | undefined
        priceData: {
          oldestFetchedTimestamp?: number | undefined
          [secondsInterval: number]: PriceChartEntry[] | undefined
        }
        transactions: Transaction[] | undefined
        lastUpdated: number | undefined
      }
    }
  }
}

export const initialState: TokensState = {
  byAddress: {
    [SupportedChainId.MAINNET]: {},
    [SupportedChainId.ROPSTEN]: {},
    [SupportedChainId.POLYGON]: {},
    [SupportedChainId.MUMBAI]: {},
  },
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateTokenData, (state, { payload: { tokens, chainId } }) => {
      tokens.map(
        (tokenData) =>
          tokenData.exists &&
          (state.byAddress[chainId][tokenData.address] = {
            ...state.byAddress[chainId][tokenData.address],
            data: tokenData,
            lastUpdated: currentTimestamp(),
          })
      )
    })
    // add address to byAddress keys if not included yet
    .addCase(addTokenKeys, (state, { payload: { tokenAddresses, chainId } }) => {
      tokenAddresses.map((address) => {
        if (!state.byAddress[chainId][address]) {
          state.byAddress[chainId][address] = {
            poolAddresses: undefined,
            data: undefined,
            chartData: undefined,
            priceData: {},
            transactions: undefined,
            lastUpdated: undefined,
          }
        }
      })
    })
    // add list of pools the token is included in
    .addCase(addPoolAddresses, (state, { payload: { tokenAddress, poolAddresses, chainId } }) => {
      state.byAddress[chainId][tokenAddress] = { ...state.byAddress[chainId][tokenAddress], poolAddresses }
    })
    // add list of pools the token is included in
    .addCase(updateChartData, (state, { payload: { tokenAddress, chartData, chainId } }) => {
      state.byAddress[chainId][tokenAddress] = { ...state.byAddress[chainId][tokenAddress], chartData }
    })
    // add list of pools the token is included in
    .addCase(updateTransactions, (state, { payload: { tokenAddress, transactions, chainId } }) => {
      state.byAddress[chainId][tokenAddress] = { ...state.byAddress[chainId][tokenAddress], transactions }
    })
    // update historical price volume based on interval size
    .addCase(
      updatePriceData,
      (state, { payload: { tokenAddress, secondsInterval, priceData, oldestFetchedTimestamp, chainId } }) => {
        state.byAddress[chainId][tokenAddress] = {
          ...state.byAddress[chainId][tokenAddress],
          priceData: {
            ...state.byAddress[chainId][tokenAddress].priceData,
            [secondsInterval]: priceData,
            oldestFetchedTimestamp,
          },
        }
      }
    )
)
