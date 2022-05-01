export interface Block {
  number: number
  timestamp: string
}

export interface ChartDayData {
  date: number
  volumeUSD: number
  tvlUSD: number
}

export enum TransactionType {
  SWAP,
  MINT,
  BURN,
}

export type Transaction = {
  type: TransactionType
  hash: string
  timestamp: string
  sender: string
  token0Symbol: string
  token1Symbol: string
  token0Address: string
  token1Address: string
  liquidity: number | null
  amountUSD: number
  amountToken0: number
  amountToken1: number
}

/**
 * Formatted type for Candlestick charts
 */
export type PriceChartEntry = {
  time: number // unix timestamp
  open: number | null
  close: number | null
  high: number | null
  low: number | null
}

export type LPReturn = {
  principal?: {
    usd: number
    amount0: number
    amount1: number
  }
  net?: {
    return: number
  }
  cocoreswap?: {
    return: number
  }
  fees?: {
    sum: number
  }

  pair?: {
    id: string
    reserve0: string
    reserve1: string
    reserveUSD: string
    token0: {
      id: string
      symbol: string
      derivedETH: string
    }
    token1: {
      id: string
      symbol: string
      derivedETH: string
    }
    totalSupply: string
  }
  liquidityTokenBalance?: string
}

export type LPSnapshots = {
  timestamp: number
  reserve0: number
  reserve1: number
  reserveUSD: number
  liquidityTokenBalance: number
  liquidityTokenTotalSupply: number
  token0PriceUSD: number
  token1PriceUSD: number
  pair: {
    id: string
    reserve0: number
    reserve1: number
    reserveUSD: number
    token0: {
      id: string
    }
    token1: {
      id: string
    }
  }
}
