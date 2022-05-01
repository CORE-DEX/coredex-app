import { createAction } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'

import { LPReturn, LPSnapshots, Transaction } from '../../../types'
import { LiquidityChartEntry, PositionChartEntry } from './reducer'

export const updateSnapshots =
  createAction<{ snapshots: LPSnapshots[]; chainId: SupportedChainId }>('user/updateSnapshots')
export const updatePositionChartData =
  createAction<{ pairAddress: string; history: PositionChartEntry[]; chainId: SupportedChainId }>(
    'user/updatePositionChartData'
  )
export const addUserKeys = createAction<{ chainId: SupportedChainId }>('user/addUsersKeys')
export const updateTransactions =
  createAction<{ transactions: Transaction[]; chainId: SupportedChainId }>('user/updateTransactions')
export const updatePositions =
  createAction<{ positions: LPReturn[]; chainId: SupportedChainId }>('user/updatePositions')
export const updateLiquidityChartData = createAction<{
  liquidityChartData: LiquidityChartEntry[]
  chainId: SupportedChainId
}>('user/updateLiquidityChartData')
