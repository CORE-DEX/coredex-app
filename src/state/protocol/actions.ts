import { createAction } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'

import { ChartDayData, Transaction } from '../../types'
import { ProtocolData } from './reducer'

// protocol wide info
export const updateProtocolData =
  createAction<{ protocolData: ProtocolData; chainId: SupportedChainId }>('protocol/updateProtocolData')
export const updateChartData =
  createAction<{ chartData: ChartDayData[]; chainId: SupportedChainId }>('protocol/updateChartData')
export const updateTransactions =
  createAction<{ transactions: Transaction[]; chainId: SupportedChainId }>('protocol/updateTransactions')
