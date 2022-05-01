import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import gql from 'graphql-tag'
import { useEffect, useState } from 'react'
import { useClients } from 'state/application/hooks'
import { useDeltaTimestamps } from 'utils/queries'

import { useBlockFromTimestamp } from './useBlocksFromTimestamps'
import { useActiveWeb3React } from './web3'

export const ETH_PRICE = (block?: any) => {
  const queryString = block
    ? `
    query bundles {
      bundles(where: { id: 1 } block: {number: ${block}}) {
        id
        ethPrice
      }
    }
  `
    : ` query bundles {
      bundles(where: { id: 1 }) {
        id
        ethPrice
      }
    }
  `
  return gql(queryString)
}

interface PricesResponse {
  bundles: {
    id: number
    ethPrice: number
  }[]
}

export interface EthPrices {
  currentPrice: number
  oneDayBackPrice: number
}

async function fetchEthPrices(
  oneDayBlock: any,
  client: ApolloClient<NormalizedCacheObject>
): Promise<{ data: EthPrices | undefined; error: boolean }> {
  try {
    const result = await client.query<PricesResponse>({
      query: ETH_PRICE(),
      //fetchPolicy: 'cache-first',
    })

    const resultOneDay = await client.query<PricesResponse>({
      query: ETH_PRICE(oneDayBlock),
      //fetchPolicy: 'cache-first',
    })

    if (result && resultOneDay && result.data !== resultOneDay.data) {
      return {
        data: {
          currentPrice: result.data.bundles[0].ethPrice,
          oneDayBackPrice: resultOneDay.data.bundles[0].ethPrice,
        },
        error: false,
      }
    } else if (result && !resultOneDay.data) {
      return {
        data: {
          currentPrice: result.data.bundles[0].ethPrice,
          oneDayBackPrice: 0,
        },
        error: false,
      }
    } else {
      return {
        data: undefined,
        error: true,
      }
    }
  } catch (e) {
    return {
      data: undefined,
      error: true,
    }
  }
}

/**
 * Gets the current price  of ETH, 24 hour price, and % change between them
 */
export function useEthPrices(): EthPrices | undefined {
  const [prices, setPrices] = useState<{ [network: string]: EthPrices | undefined }>()
  const { dataClient } = useClients()
  const [t24] = useDeltaTimestamps()
  const oneDayBlock = useBlockFromTimestamp(t24)
  // index on active network
  const { chainId } = useActiveWeb3React()
  const indexedPrices = prices?.[chainId ?? -1]

  useEffect(() => {
    async function fetch() {
      const { data } = await fetchEthPrices(oneDayBlock, dataClient)
      if (dataClient) {
        setPrices({
          [chainId ?? -1]: data,
        })
      }
    }
    if (!indexedPrices && oneDayBlock) {
      fetch()
    }
  }, [prices, oneDayBlock, dataClient, indexedPrices, chainId])
  return prices?.[chainId ?? -1]
}
