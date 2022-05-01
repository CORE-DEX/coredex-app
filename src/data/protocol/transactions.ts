import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import gql from 'graphql-tag'
import { formatTokenSymbol } from 'utils/tokens'

import { Transaction, TransactionType } from '../../types'

export const GLOBAL_TRANSACTIONS = gql`
  query transactions {
    transactions(first: 100, orderBy: timestamp, orderDirection: desc) {
      mints(orderBy: timestamp, orderDirection: desc) {
        transaction {
          id
          timestamp
        }
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        to
        liquidity
        amount0
        amount1
        amountUSD
      }
      burns(orderBy: timestamp, orderDirection: desc) {
        transaction {
          id
          timestamp
        }
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        sender
        liquidity
        amount0
        amount1
        amountUSD
      }
      swaps(orderBy: timestamp, orderDirection: desc) {
        transaction {
          id
          timestamp
        }
        pair {
          token0 {
            id
            symbol
          }
          token1 {
            id
            symbol
          }
        }
        amount0In
        amount0Out
        amount1In
        amount1Out
        amountUSD
        to
      }
    }
  }
`

type TransactionEntry = {
  mints: {
    transaction: {
      id: string
      timestamp: string
    }
    pair: {
      token0: {
        id: string
        symbol: string
      }
      token1: {
        id: string
        symbol: string
      }
    }
    to: string
    liquidity: string
    amount0: string
    amount1: string
    amountUSD: string
  }[]
  swaps: {
    transaction: {
      id: string
      timestamp: string
    }
    pair: {
      token0: {
        id: string
        symbol: string
      }
      token1: {
        id: string
        symbol: string
      }
    }
    amount0In: string
    amount0Out: string
    amount1In: string
    amount1Out: string
    amountUSD: string
    to: string
  }[]
  burns: {
    transaction: {
      id: string
      timestamp: string
    }
    pair: {
      token0: {
        id: string
        symbol: string
      }
      token1: {
        id: string
        symbol: string
      }
    }
    sender: string
    liquidity: string
    amount0: string
    amount1: string
    amountUSD: string
  }[]
}

interface TransactionResults {
  transactions: TransactionEntry[]
}

export async function fetchTopTransactions(
  client: ApolloClient<NormalizedCacheObject>,
  activeNetwork: number | undefined
): Promise<Transaction[] | undefined> {
  try {
    const { data, error, loading } = await client.query<TransactionResults>({
      query: GLOBAL_TRANSACTIONS,
      fetchPolicy: 'cache-first',
    })

    if (error || loading || !data) {
      return undefined
    }

    const formatted = data.transactions.reduce((accum: Transaction[], t: TransactionEntry) => {
      const mintEntries = t.mints.map((m) => {
        return {
          type: TransactionType.MINT,
          hash: m.transaction.id,
          timestamp: m.transaction.timestamp,
          sender: m.to,
          liquidity: parseFloat(m.liquidity),
          token0Symbol: formatTokenSymbol(m.pair.token0.id, m.pair.token0.symbol, activeNetwork),
          token1Symbol: formatTokenSymbol(m.pair.token1.id, m.pair.token1.symbol, activeNetwork),
          token0Address: m.pair.token0.id,
          token1Address: m.pair.token1.id,
          amountUSD: parseFloat(m.amountUSD),
          amountToken0: parseFloat(m.amount0),
          amountToken1: parseFloat(m.amount1),
        }
      })
      const burnEntries = t.burns.map((m) => {
        return {
          type: TransactionType.BURN,
          hash: m.transaction.id,
          timestamp: m.transaction.timestamp,
          sender: m.sender,
          liquidity: parseFloat(m.liquidity),
          token0Symbol: formatTokenSymbol(m.pair.token0.id, m.pair.token0.symbol, activeNetwork),
          token1Symbol: formatTokenSymbol(m.pair.token1.id, m.pair.token1.symbol, activeNetwork),
          token0Address: m.pair.token0.id,
          token1Address: m.pair.token1.id,
          amountUSD: parseFloat(m.amountUSD),
          amountToken0: parseFloat(m.amount0),
          amountToken1: parseFloat(m.amount1),
        }
      })

      const swapEntries = t.swaps.map((m) => {
        const netToken0 = parseFloat(m.amount0In) - parseFloat(m.amount0Out)
        const netToken1 = parseFloat(m.amount1In) - parseFloat(m.amount1Out)

        return netToken0 < 0
          ? {
              hash: m.transaction.id,
              type: TransactionType.SWAP,
              timestamp: m.transaction.timestamp,
              sender: m.to,
              liquidity: null,
              token0Symbol: formatTokenSymbol(m.pair.token0.id, m.pair.token0.symbol, activeNetwork),
              token1Symbol: formatTokenSymbol(m.pair.token1.id, m.pair.token1.symbol, activeNetwork),
              token0Address: m.pair.token0.id,
              token1Address: m.pair.token1.id,
              amountUSD: parseFloat(m.amountUSD),
              amountToken0: Math.abs(netToken0),
              amountToken1: Math.abs(netToken1),
            }
          : {
              hash: m.transaction.id,
              type: TransactionType.SWAP,
              timestamp: m.transaction.timestamp,
              sender: m.to,
              liquidity: null,
              token0Symbol: formatTokenSymbol(m.pair.token1.id, m.pair.token1.symbol, activeNetwork),
              token1Symbol: formatTokenSymbol(m.pair.token0.id, m.pair.token0.symbol, activeNetwork),
              token0Address: m.pair.token1.id,
              token1Address: m.pair.token0.id,
              amountUSD: parseFloat(m.amountUSD),
              amountToken0: Math.abs(netToken1),
              amountToken1: Math.abs(netToken0),
            }
      })
      accum = [...accum, ...mintEntries, ...burnEntries, ...swapEntries]
      return accum
    }, [])

    return formatted
  } catch {
    return undefined
  }
}
