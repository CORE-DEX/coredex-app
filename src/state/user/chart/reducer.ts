import { createReducer } from '@reduxjs/toolkit'

import { LPReturn, LPSnapshots, Transaction } from '../../../types'
import {
  addUserKeys,
  updateLiquidityChartData,
  updatePositionChartData,
  updatePositions,
  updateSnapshots,
  updateTransactions,
} from './actions'

export interface LiquidityChartEntry {
  date: number
  volumeUSD: number
}

export interface PositionChartEntry {
  date: number
  usdValue: number
  fees: number
}

export interface UserState {
  byAccount: {
    [chainId: number]: {
      snapshots: LPSnapshots[] | undefined
      transactions: Transaction[] | undefined
      positions: LPReturn[] | undefined
      liquidityChartData: LiquidityChartEntry[] | undefined
      positionChartData: {
        [pairAddress: string]: {
          history: PositionChartEntry[] | undefined
        }
      }
    }
  }
}

export const initialState: UserState = {
  byAccount: {},
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateSnapshots, (state, { payload: { snapshots, chainId } }) => {
      state.byAccount[chainId] = { ...state.byAccount[chainId], snapshots }
    })
    .addCase(updatePositionChartData, (state, { payload: { pairAddress, history, chainId } }) => {
      state.byAccount[chainId].positionChartData[pairAddress] = {
        ...state.byAccount[chainId].positionChartData[pairAddress],
        history,
      }
    })
    .addCase(addUserKeys, (state, { payload: { chainId } }) => {
      if (!state.byAccount[chainId]) {
        state.byAccount[chainId] = {
          snapshots: undefined,
          transactions: undefined,
          positions: undefined,
          liquidityChartData: undefined,
          positionChartData: {},
        }
      }
    })
    .addCase(updateTransactions, (state, { payload: { transactions, chainId } }) => {
      state.byAccount[chainId] = { ...state.byAccount[chainId], transactions }
    })
    .addCase(updatePositions, (state, { payload: { positions, chainId } }) => {
      state.byAccount[chainId] = { ...state.byAccount[chainId], positions }
    })
    .addCase(updateLiquidityChartData, (state, { payload: { liquidityChartData, chainId } }) => {
      state.byAccount[chainId] = { ...state.byAccount[chainId], liquidityChartData }
    })
)
