import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import gql from 'graphql-tag'

import { LPReturn, LPSnapshots } from '../../types'

const USER_POSITIONS = gql`
  query liquidityPositions($user: Bytes!) {
    liquidityPositions(where: { user: $user }) {
      pair {
        id
        reserve0
        reserve1
        reserveUSD
        token0 {
          id
          symbol
          derivedETH
        }
        token1 {
          id
          symbol
          derivedETH
        }
        totalSupply
      }
      liquidityTokenBalance
    }
  }
`

const USER_MINTS_BUNRS_PER_PAIR = gql`
  query events($user: Bytes!, $pair: Bytes!) {
    mints(where: { to: $user, pair: $pair }) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
    burns(where: { sender: $user, pair: $pair }) {
      amountUSD
      amount0
      amount1
      timestamp
      pair {
        token0 {
          id
        }
        token1 {
          id
        }
      }
    }
  }
`

interface PositionResults {
  liquidityPositions: {
    pair: {
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
    liquidityTokenBalance: string
  }[]
}

interface PositionPair {
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

interface UserMintBarnResults {
  mints: {
    amountUSD: string
    amount0: string
    amount1: string
    timestamp: number
    pair: {
      token0: {
        id: string
      }
      token1: {
        id: string
      }
    }
  }[]
  burns: {
    amountUSD: string
    amount0: string
    amount1: string
    timestamp: number
    pair: {
      token0: {
        id: string
      }
      token1: {
        id: string
      }
    }
  }[]
}

interface ReturnMetrics {
  hodleReturn: number // difference in asset values t0 -> t1 with t0 deposit amounts
  netReturn: number // net return from t0 -> t1
  coreDexReturn: number // netReturn - hodlReturn
  impLoss: number
  fees: number
}

async function getPrincipalForUserPerPair(
  user: string,
  pairAddress: string,
  dataClient: ApolloClient<NormalizedCacheObject>
) {
  let usd = 0
  let amount0 = 0
  let amount1 = 0
  // get all minst and burns to get principal amounts
  const {
    data: results,
    error,
    loading,
  } = await dataClient.query<UserMintBarnResults>({
    query: USER_MINTS_BUNRS_PER_PAIR,
    variables: {
      user,
      pair: pairAddress,
    },
  })

  if (error) {
    return {
      usd: 0,
      amount0: 0,
      amount1: 0,
    }
  }
  if (!loading && !results) {
    return {
      usd: 0,
      amount0: 0,
      amount1: 0,
    }
  }

  for (const index in results.mints) {
    const mint = results.mints[index]

    usd += parseFloat(mint.amountUSD)
    amount0 += parseFloat(mint.amount0)
    amount1 += parseFloat(mint.amount1)
  }

  for (const index in results.burns) {
    const burn = results.burns[index]

    usd -= parseFloat(burn.amountUSD)
    amount0 -= parseFloat(burn.amount0)
    amount1 -= parseFloat(burn.amount1)
  }

  return { usd, amount0, amount1 }
}

export function getMetricsForPositionWindow(position0: LPSnapshots, position1: LPSnapshots): ReturnMetrics {
  // calculate ownership at ends of window, for end of window we need original LP token balance / new total supply
  const t0Ownership = position0.liquidityTokenBalance / position0.liquidityTokenTotalSupply
  const t1Ownership = position0.liquidityTokenBalance / position1.liquidityTokenTotalSupply

  // get starting amounts of token0 and token1 deposited by LP
  const token0_amount_t0 = t0Ownership * position0.reserve0
  const token1_amount_t0 = t0Ownership * position0.reserve1

  // get current token values
  const token0_amount_t1 = t1Ownership * position1.reserve0
  const token1_amount_t1 = t1Ownership * position1.reserve1

  // calculate squares to find imp loss and fee differences
  const sqrK_t0 = Math.sqrt(token0_amount_t0 * token1_amount_t0)
  // eslint-disable-next-line eqeqeq
  const priceRatioT1 = position1.token0PriceUSD != 0 ? position1.token1PriceUSD / position1.token0PriceUSD : 0

  const token0_amount_no_fees = position1.token1PriceUSD && priceRatioT1 ? sqrK_t0 * Math.sqrt(priceRatioT1) : 0
  const token1_amount_no_fees = Number(position1.token1PriceUSD) && priceRatioT1 ? sqrK_t0 / Math.sqrt(priceRatioT1) : 0
  const no_fees_usd =
    token0_amount_no_fees * position1.token0PriceUSD + token1_amount_no_fees * position1.token1PriceUSD

  const difference_fees_token0 = token0_amount_t1 - token0_amount_no_fees
  const difference_fees_token1 = token1_amount_t1 - token1_amount_no_fees
  const difference_fees_usd =
    difference_fees_token0 * position1.token0PriceUSD + difference_fees_token1 * position1.token1PriceUSD

  // calculate USD value at t0 and t1 using initial token deposit amounts for asset return
  const assetValueT0 = token0_amount_t0 * position0.token0PriceUSD + token1_amount_t0 * position0.token1PriceUSD
  const assetValueT1 = token0_amount_t0 * position1.token0PriceUSD + token1_amount_t0 * position1.token1PriceUSD

  const imp_loss_usd = no_fees_usd - assetValueT1
  const coredex_return = difference_fees_usd + imp_loss_usd

  // get net value change for combined data
  const netValueT0 = t0Ownership * position0.reserveUSD
  const netValueT1 = t1Ownership * position1.reserveUSD

  return {
    hodleReturn: assetValueT1 - assetValueT0,
    netReturn: netValueT1 - netValueT0,
    coreDexReturn: coredex_return,
    impLoss: imp_loss_usd,
    fees: difference_fees_usd,
  }
}

export async function getLPReturnsOnPair(
  user: string,
  pair: PositionPair,
  snapshots: LPSnapshots[],
  ethPrice: number,
  dataClient: ApolloClient<NormalizedCacheObject>
): Promise<LPReturn> {
  // initialize values
  const principal = await getPrincipalForUserPerPair(user, pair.id, dataClient)
  let hodlReturn = 0
  let netReturn = 0
  let coreDexReturn = 0
  let fees = 0

  snapshots = snapshots.filter((entry) => {
    return entry.pair.id === pair.id
  })

  // get data about the current position
  const currentPosition: LPSnapshots = {
    timestamp: snapshots[snapshots.length - 1]?.timestamp,
    pair: snapshots[snapshots.length - 1]?.pair,
    liquidityTokenBalance: snapshots[snapshots.length - 1]?.liquidityTokenBalance,
    liquidityTokenTotalSupply: parseFloat(pair.totalSupply),
    reserve0: parseFloat(pair.reserve0),
    reserve1: parseFloat(pair.reserve1),
    reserveUSD: parseFloat(pair.reserveUSD),
    token0PriceUSD: parseFloat(pair.token0.derivedETH) * ethPrice,
    token1PriceUSD: parseFloat(pair.token1.derivedETH) * ethPrice,
  }

  for (const index in snapshots) {
    // get positions at both bounds of the window
    const positionT0 = snapshots[index]
    const positionT1 = parseInt(index) === snapshots.length - 1 ? currentPosition : snapshots[parseInt(index) + 1]

    const results = getMetricsForPositionWindow(positionT0, positionT1)
    hodlReturn = hodlReturn + results.hodleReturn
    netReturn = netReturn + results.netReturn
    coreDexReturn = coreDexReturn + results.coreDexReturn
    fees = fees + results.fees
  }

  return {
    principal,
    net: {
      return: netReturn,
    },
    coredex: {
      return: coreDexReturn,
    },
    fees: {
      sum: fees,
    },
  }
}

export async function fetchUserPositions(
  account: string,
  snapshots: LPSnapshots[],
  ethPrice: number | undefined,
  dataClient: ApolloClient<NormalizedCacheObject>
): Promise<{ data: LPReturn[] | undefined; error: boolean; loading: boolean }> {
  const { data, error, loading } = await dataClient.query<PositionResults>({
    query: USER_POSITIONS,
    variables: {
      user: account.toLowerCase(),
    },
    fetchPolicy: 'no-cache',
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

  let formattedPositions
  if (data && snapshots && ethPrice) {
    formattedPositions = await Promise.all(
      data.liquidityPositions.map(async (positionData) => {
        const returnData = await getLPReturnsOnPair(account, positionData.pair, snapshots, ethPrice, dataClient)
        return {
          ...positionData,
          ...returnData,
        }
      })
    )
  }

  return { data: formattedPositions, error: false, loading: false }
}
