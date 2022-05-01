import { createAction } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'

import { PriceChartEntry, Transaction } from '../../types'
import { PoolChartEntry, PoolData } from './reducer'

// protocol wide info
export const updatePoolData = createAction<{ pools: PoolData[]; chainId: SupportedChainId }>('pools/updatePoolData')

// add pool address to byAddress
export const addPoolKeys = createAction<{ poolAddresses: string[]; chainId: SupportedChainId }>('pool/addPoolKeys')

export const updatePoolChartData = createAction<{
  poolAddress: string
  chartData: PoolChartEntry[]
  chainId: SupportedChainId
}>('pool/updatePoolChartData')

export const updatePoolTransactions = createAction<{
  poolAddress: string
  transactions: Transaction[]
  chainId: SupportedChainId
}>('pool/updatePoolTransactions')

export const updataPoolHoulyRates = createAction<{
  poolAddress: string
  secondsInterval: number
  hourlyData: {
    rate0: PriceChartEntry[]
    rate1: PriceChartEntry[]
  }
  oldestFetchedTimestamp: number
  chainId: SupportedChainId
}>('pool/updataPoolHoulyRates')
