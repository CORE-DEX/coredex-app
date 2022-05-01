import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import gql from 'graphql-tag'

const TokenFields = `
  fragment TokenFields on Token {
    id
    name
    symbol
    derivedETH
    tradeVolume
    tradeVolumeUSD
    untrackedVolumeUSD
    totalLiquidity
    txCount
  }
`

export const TOKEN_DATA = (tokenAddress: string, block?: number) => {
  const queryString = `
    ${TokenFields}
    query tokens {
      tokens(${block ? `block : {number: ${block}}` : ``} where: {id:"${tokenAddress}"}) {
        ...TokenFields
      }
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
    }
  `
  return gql(queryString)
}

interface PoolsForTokenResponse {
  pairs0: {
    id: string
  }[]
  pairs1: {
    id: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export async function fetchPoolsForToken(
  address: string,
  client: ApolloClient<NormalizedCacheObject>
): Promise<{
  loading: boolean
  error: boolean
  addresses: string[] | undefined
}> {
  try {
    const { loading, error, data } = await client.query<PoolsForTokenResponse>({
      query: TOKEN_DATA(address),
      variables: {
        address: address,
      },
      fetchPolicy: 'cache-first',
    })

    if (loading || error || !data) {
      return {
        loading,
        error: Boolean(error),
        addresses: undefined,
      }
    }

    const formattedData = data.pairs0.concat(data.pairs1).map((p) => p.id)

    return {
      loading,
      error: Boolean(error),
      addresses: formattedData,
    }
  } catch {
    return {
      loading: false,
      error: true,
      addresses: undefined,
    }
  }
}
