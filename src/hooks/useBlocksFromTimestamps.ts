import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import gql from 'graphql-tag'
import { useEffect, useMemo, useState } from 'react'
import { useClients } from 'state/application/hooks'
import { splitQuery } from 'utils/queries'
import { sortDecending } from 'utils/sortDecending'

import { useActiveWeb3React } from './web3'

export const GET_BLOCKS = (timestamps: string[]) => {
  let queryString = 'query blocks {'
  queryString += timestamps.map((timestamp) => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
      timestamp + 600
    } }) {
        number
      }`
  })
  queryString += '}'
  return gql(queryString)
}

/**
 * for a given array of timestamps, returns block entities
 * @param timestamps
 */
export function useBlocksFromTimestamps(
  timestamps: number[],
  blockClientOverride?: ApolloClient<NormalizedCacheObject>
): {
  blocks:
    | {
        timestamp: string
        number: any
      }[]
    | undefined
  error: boolean
} {
  const { chainId } = useActiveWeb3React()
  const [blocks, setBlocks] = useState<any>()
  const [error, setError] = useState(false)

  const { blockClient } = useClients()
  const activeBlockClient = blockClientOverride ?? blockClient

  // derive blocks based on active network
  const networkBlocks = blocks?.[chainId ?? -1]

  useEffect(() => {
    async function fetchData() {
      const results = await splitQuery(GET_BLOCKS, activeBlockClient, [], timestamps)
      if (results) {
        setBlocks({ ...(blocks ?? {}), [chainId ?? -1]: results })
      } else {
        setError(true)
      }
    }
    if (!networkBlocks && !error) {
      fetchData()
    }
  })

  const blocksFormatted = useMemo(() => {
    if (blocks?.[chainId ?? -1]) {
      const networkBlocks = blocks?.[chainId ?? -1]
      const formatted = []
      for (const t in networkBlocks) {
        if (networkBlocks[t].length > 0) {
          formatted.push({
            timestamp: t.split('t')[1],
            number: networkBlocks[t][0]['number'],
          })
        }
      }
      formatted.sort((a, b) => sortDecending(a.timestamp, b.timestamp))
      return formatted
    }
    return undefined
  }, [chainId, blocks])

  return {
    blocks: blocksFormatted,
    error,
  }
}

/**
 * @notice Fetches block objects for an array of timestamps.
 * @dev blocks are returned in chronological order (ASC) regardless of input.
 * @dev blocks are returned at string representations of Int
 * @dev timestamps are returns as they were provided; not the block time.
 * @param {Array} timestamps
 */
export async function getBlocksFromTimestamps(
  timestamps: number[],
  blockClient: ApolloClient<NormalizedCacheObject>,
  skipCount = 500
) {
  if (timestamps?.length === 0) {
    return []
  }
  const fetchedData: any = await splitQuery(GET_BLOCKS, blockClient, [], timestamps, skipCount)

  const blocks: any[] = []
  if (fetchedData) {
    for (const t in fetchedData) {
      if (fetchedData[t].length > 0) {
        blocks.push({
          timestamp: t.split('t')[1],
          number: fetchedData[t][0]['number'],
        })
      }
    }
  }
  return blocks
}

export const GET_BLOCK = gql`
  query blocks($timestampFrom: Int!, $timestampTo: Int!) {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
    ) {
      id
      number
      timestamp
    }
  }
`

export function useBlockFromTimestamp(timestamp: number): { block: number } {
  const [block, setBlock] = useState<any>()
  const [error, setError] = useState(false)
  const { blockClient } = useClients()

  useEffect(() => {
    async function fetchBlock() {
      const result: any = await blockClient.query({
        query: GET_BLOCK,
        variables: {
          timestampFrom: timestamp,
          timestampTo: timestamp + 600,
        },
        //fetchPolicy: 'cache-first',
      })
      if (result) {
        setBlock(result?.data?.blocks?.[0]?.number)
      } else {
        setError(true)
      }
    }
    if (!error) {
      fetchBlock()
    }
  })

  return block
}
