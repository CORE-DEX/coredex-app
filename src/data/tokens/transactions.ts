import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import gql from 'graphql-tag'
import { formatTokenSymbol } from 'utils/tokens'

import { Transaction, TransactionType } from '../../types'

export const FILTERED_TRANSACTIONS = gql`
  query ($allPairs: [Bytes]!) {
    mints(first: 20, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
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
    burns(first: 20, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
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
    swaps(first: 30, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
      transaction {
        id
        timestamp
      }
      id
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
`

interface TransactionResults {
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

export async function fetchTokenTransactions(
  address: (string | null)[],
  client: ApolloClient<NormalizedCacheObject>,
  activeNetwork: number | undefined
): Promise<{ data: Transaction[] | undefined; error: boolean; loading: boolean }> {
  const { data, error, loading } = await client.query<TransactionResults>({
    query: FILTERED_TRANSACTIONS,
    variables: {
      allPairs: address,
    },
    fetchPolicy: 'cache-first',
  })

  if (error) {
    return {
      data: undefined,
      error: true,
      loading: false,
    }
  }

  if (!loading && !data) {
    return {
      data: undefined,
      error: false,
      loading: true,
    }
  }

  const mints = data.mints.map((m) => {
    return {
      type: TransactionType.MINT,
      hash: m.transaction.id,
      timestamp: m.transaction.timestamp,
      sender: m.to,
      token0Symbol: formatTokenSymbol(m.pair.token0.id, m.pair.token0.symbol, activeNetwork),
      token1Symbol: formatTokenSymbol(m.pair.token1.id, m.pair.token1.symbol, activeNetwork),
      token0Address: m.pair.token0.id,
      token1Address: m.pair.token1.id,
      liquidity: parseFloat(m.liquidity),
      amountUSD: parseFloat(m.amountUSD),
      amountToken0: parseFloat(m.amount0),
      amountToken1: parseFloat(m.amount1),
    }
  })
  const burns = data.burns.map((m) => {
    return {
      type: TransactionType.BURN,
      hash: m.transaction.id,
      timestamp: m.transaction.timestamp,
      sender: m.sender,
      token0Symbol: formatTokenSymbol(m.pair.token0.id, m.pair.token0.symbol, activeNetwork),
      token1Symbol: formatTokenSymbol(m.pair.token1.id, m.pair.token1.symbol, activeNetwork),
      token0Address: m.pair.token0.id,
      token1Address: m.pair.token1.id,
      liquidity: parseFloat(m.liquidity),
      amountUSD: parseFloat(m.amountUSD),
      amountToken0: parseFloat(m.amount0),
      amountToken1: parseFloat(m.amount1),
    }
  })
  const swaps = data.swaps.map((m) => {
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

  return { data: [...mints, ...burns, ...swaps], error: false, loading: false }
}
