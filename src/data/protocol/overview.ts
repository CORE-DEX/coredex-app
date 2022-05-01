import { ApolloClient, NormalizedCacheObject, useQuery } from '@apollo/client'
import { FACTORY_ADDRESS } from '@cocore/swap-sdk'
import gql from 'graphql-tag'
import { useBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { useEthPrices } from 'hooks/useEthPrices'
import { useMemo } from 'react'
import { useClients } from 'state/application/hooks'
import { ProtocolData } from 'state/protocol/reducer'
import { get2DayChange, getPercentChange } from 'utils/data'
import { useDeltaTimestamps } from 'utils/queries'

export const GLOBAL_DATA = (block?: string) => {
  const queryString = ` query cocoreswapFactories {
      cocoreswapFactories(
       ${block ? `block: { number: ${block}}` : ``} 
       where: { id: "${FACTORY_ADDRESS}" }) {
        totalVolumeUSD
        totalVolumeETH
        untrackedVolumeUSD
        totalLiquidityUSD
        totalLiquidityETH
        txCount
        pairCount
      }
    }`
  return gql(queryString)
}

interface GlobalResponse {
  cocoreswapFactories: {
    totalVolumeUSD: string
    totalVolumeETH: string
    untrackedVolumeUSD: string
    totalLiquidityUSD: string
    totalLiquidityETH: string
    txCount: string
    pairCount: string
  }[]
}

export function useFetchProtocolData(
  dataClientOverride?: ApolloClient<NormalizedCacheObject>,
  blockClientOverride?: ApolloClient<NormalizedCacheObject>
): {
  loading: boolean
  error: boolean
  data: ProtocolData | undefined
} {
  // get appropriate clients if override needed
  const { dataClient, blockClient } = useClients()
  const activeDataClient = dataClientOverride ?? dataClient
  const activeBlockClient = blockClientOverride ?? blockClient
  const ethPrices = useEthPrices()

  // get blocks from historic timestamps
  const [t24, t48] = useDeltaTimestamps()
  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48], activeBlockClient)
  const [block24, block48] = blocks ?? []

  // fetch all data
  const { loading, error, data } = useQuery<GlobalResponse>(GLOBAL_DATA(), { client: activeDataClient })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery<GlobalResponse>(GLOBAL_DATA(block24?.number ?? undefined), { client: activeDataClient })

  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = useQuery<GlobalResponse>(GLOBAL_DATA(block48?.number ?? undefined), { client: activeDataClient })

  const anyError = Boolean(error || error24 || error48 || blockError)
  const anyLoading = Boolean(loading || loading24 || loading48)

  const parsed = data?.cocoreswapFactories?.[0]
  const parsed24 = data24?.cocoreswapFactories?.[0]
  const parsed48 = data48?.cocoreswapFactories?.[0]

  const formattedData: ProtocolData | undefined = useMemo(() => {
    if (anyError || anyLoading || !parsed || !blocks) {
      return undefined
    }

    if (!ethPrices) {
      return undefined
    }

    // volume data
    const [volumeUSD, volumeUSDChange] =
      parsed && parsed24 && parsed48
        ? get2DayChange(parsed.totalVolumeUSD, parsed24.totalVolumeUSD, parsed48.totalVolumeUSD)
        : [parseFloat(parsed.totalVolumeUSD), 0]

    // total value locked
    const tvlUSD = parseFloat(parsed?.totalLiquidityETH) * ethPrices?.currentPrice

    const currentTvlUSD = Number(parsed?.totalLiquidityETH) * ethPrices?.currentPrice
    const twoTvlUSD = Number(parsed24?.totalLiquidityETH) * ethPrices?.oneDayBackPrice

    const tvlUSDChange = getPercentChange(currentTvlUSD.toString(), twoTvlUSD.toString())

    // 24H transactions
    const txCount =
      parsed && parsed24 ? parseFloat(parsed.txCount) - parseFloat(parsed24.txCount) : parseFloat(parsed.txCount)

    const txCountOneWindowAgo =
      parsed24 && parsed48 ? parseFloat(parsed24.txCount) - parseFloat(parsed48.txCount) : undefined

    const txCountChange =
      txCount && txCountOneWindowAgo ? getPercentChange(txCount.toString(), txCountOneWindowAgo.toString()) : 0

    const feesUSD = volumeUSD ? volumeUSD * 0.003 : 0

    const feeChange = volumeUSDChange ? volumeUSDChange : 0

    return {
      volumeUSD,
      volumeUSDChange: typeof volumeUSDChange === 'number' ? volumeUSDChange : 0,
      tvlUSD,
      tvlUSDChange,
      feesUSD,
      feeChange,
      txCount,
      txCountChange,
    }
  }, [anyError, anyLoading, blocks, parsed, parsed24, parsed48, ethPrices])

  return {
    loading: anyLoading,
    error: anyError,
    data: formattedData,
  }
}

export function useFetchAggregateProtocolData(): {
  loading: boolean
  error: boolean
  data: ProtocolData | undefined
} {
  const { dataClient, blockClient } = useClients()
  const {
    data: ethereumData,
    loading: loadingEthereum,
    error: errorEthereum,
  } = useFetchProtocolData(dataClient, blockClient)

  if (!ethereumData) {
    return {
      data: undefined,
      loading: false,
      error: false,
    }
  }

  return {
    data: undefined,
    loading: false,
    error: false,
  }
}
