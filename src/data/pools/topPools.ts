import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'
import { useClients } from 'state/application/hooks'

export const PAIRS_CURRENT = gql`
  query pairs {
    pairs(first: 200, orderBy: reserveUSD, orderDirection: desc) {
      id
    }
  }
`

interface TopPoolsResponse {
  pairs: {
    id: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function useTopPoolAddresses(): {
  loading: boolean
  error: boolean
  addresses: string[] | undefined
} {
  const { dataClient } = useClients()
  const { loading, error, data } = useQuery<TopPoolsResponse>(PAIRS_CURRENT, {
    client: dataClient,
    fetchPolicy: 'cache-first',
  })

  const formattedData = useMemo(() => {
    if (data) {
      return data.pairs.map((p) => p.id)
    } else {
      return undefined
    }
  }, [data])

  return {
    loading: loading,
    error: Boolean(error),
    addresses: formattedData,
  }
}
