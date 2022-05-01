import { ApolloError, useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useMemo } from 'react'
import { useClients } from 'state/application/hooks'

export const TOP_TOKENS = (date: any | undefined) => {
  const queryString = `
  query tokenDayDatas {
    tokenDayDatas(first: 50, orderBy: totalLiquidityUSD, orderDirection: desc, ${
      date ? 'where: { date_gt: ' + date + '}' : ''
    }) {
      id
      #date
    }
  }
`
  return gql(queryString)
}

interface TopTokensResponse {
  tokenDayDatas: {
    id: string
  }[]
}

/**
 * Fetch top addresses by volume
 */
export function useTopTokenAddresses(): {
  loading: boolean
  error: boolean
  addresses: string[] | undefined
} {
  const { dataClient } = useClients()
  const currentDate = parseInt((Date.now() / 86400 / 1000).toString()) * 86400 - 86400

  const { loading, error, data } = useQuery<TopTokensResponse>(TOP_TOKENS(currentDate), {
    client: dataClient,
  })

  const {
    loading: totalLoading,
    error: totalError,
    data: totalData,
  } = useQuery<TopTokensResponse>(TOP_TOKENS(undefined), {
    client: dataClient,
  })

  let selectedLoading: boolean
  let selectedError: ApolloError | undefined
  let selectedData: TopTokensResponse | undefined
  const emptyData: TopTokensResponse = { tokenDayDatas: [] }

  if (JSON.stringify(data) == JSON.stringify(emptyData)) {
    selectedLoading = totalLoading
    selectedError = totalError
    selectedData = totalData
  } else {
    selectedLoading = loading
    selectedError = error
    selectedData = data
  }

  const formattedData = useMemo(() => {
    if (selectedData) {
      return selectedData.tokenDayDatas.map((t) => t.id.slice(0, 42))
    } else {
      return undefined
    }
  }, [selectedData])

  return {
    loading: selectedLoading,
    error: Boolean(selectedError),
    addresses: formattedData,
  }
}
