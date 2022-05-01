import { createAction } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'

import { PriceChartEntry, Transaction } from '../../types'
import { TokenChartEntry, TokenData } from './reducer'

// protocol wide info
export const updateTokenData =
  createAction<{ tokens: TokenData[]; chainId: SupportedChainId }>('tokens/updateTokenData')

// add token address to byAddress
export const addTokenKeys = createAction<{ tokenAddresses: string[]; chainId: SupportedChainId }>('tokens/addTokenKeys')

// add list of pools token is in
export const addPoolAddresses = createAction<{
  tokenAddress: string
  poolAddresses: string[]
  chainId: SupportedChainId
}>('tokens/addPoolAddresses')

// tvl and volume data over time
export const updateChartData = createAction<{
  tokenAddress: string
  chartData: TokenChartEntry[]
  chainId: SupportedChainId
}>('tokens/updateChartData')

// transactions
export const updateTransactions = createAction<{
  tokenAddress: string
  transactions: Transaction[]
  chainId: SupportedChainId
}>('tokens/updateTransactions')

// price data at arbitrary intervals
export const updatePriceData = createAction<{
  tokenAddress: string
  secondsInterval: number
  priceData: PriceChartEntry[] | undefined
  oldestFetchedTimestamp: number
  chainId: SupportedChainId
}>('tokens/updatePriceData')
