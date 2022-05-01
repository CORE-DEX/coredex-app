import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import gql from 'graphql-tag'

import { LPSnapshots } from '../../types'

const USER_HISTORY = gql`
  query snapshots($user: Bytes!, $skip: Int!) {
    liquidityPositionSnapshots(first: 1000, skip: $skip, where: { user: $user }) {
      timestamp
      reserveUSD
      liquidityTokenBalance
      liquidityTokenTotalSupply
      reserve0
      reserve1
      token0PriceUSD
      token1PriceUSD
      pair {
        id
        reserve0
        reserve1
        reserveUSD
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

interface SnapshotsReturn {
  liquidityPositionSnapshots: LPSnapshots[]
}

export async function fetchUserLPSnapshots(
  account: string,
  client: ApolloClient<NormalizedCacheObject>
): Promise<{ data: LPSnapshots[] | undefined; error: boolean }> {
  let skip = 0
  let allResults: LPSnapshots[] = []
  let found = false
  while (!found) {
    const { data } = await client.query<SnapshotsReturn>({
      query: USER_HISTORY,
      variables: {
        user: account.toLowerCase(),
        skip: skip,
      },
      fetchPolicy: 'cache-first',
    })
    allResults = allResults.concat(data.liquidityPositionSnapshots)
    if (allResults.length <= 1000) {
      found = true
    } else {
      skip += 1000
    }
  }

  if (allResults === undefined) {
    return {
      data: undefined,
      error: true,
    }
  }

  return { data: allResults, error: false }
}
