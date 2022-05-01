import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { useEthPrices } from 'hooks/useEthPrices'
import { useActiveWeb3React } from 'hooks/web3'
import { useClients } from 'state/application/hooks'
import { PoolData } from 'state/pools/reducer'
import { get2DayChange, getPercentChange } from 'utils/data'
import { useDeltaTimestamps } from 'utils/queries'
import { formatTokenName, formatTokenSymbol } from 'utils/tokens'

const PairFields = `
  fragment PairFields on Pair {
    id
    txCount
    token0 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    token1 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    reserve0
    reserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    reserveETH
    volumeUSD
    untrackedVolumeUSD
    token0Price
    token1Price
    createdAtTimestamp
  }
`

export const PAIRS_BULK = gql`
  ${PairFields}
  query pairs($pairAddresses: [Bytes]!) {
    pairs(first: 500, where: { id_in: $pairAddresses }, orderBy: trackedReserveETH, orderDirection: desc) {
      ...PairFields
    }
  }
`

export const PAIRS_HISTORICAL_BULK = (block: number | undefined, pairs: string[]) => {
  let pairsString = `[`
  pairs.map((pair) => {
    return (pairsString += `"${pair}"`)
  })
  pairsString += ']'
  const queryString = `
  query pairs {
    pairs(first: 200, where: {id_in: ${pairsString}}, block: {number: ${block}}, orderBy: trackedReserveETH, orderDirection: desc) {
      id
      reserveUSD
      trackedReserveETH
      volumeUSD
      untrackedVolumeUSD
    }
  }
  `
  return gql(queryString)
}

export const PAIR_DATA = (pairAddress: string, block: number | undefined) => {
  const queryString = `
    ${PairFields}
    query pairs {
      pairs(${block ? `block: {number: ${block}}` : ``} where: { id: "${pairAddress}"} ) {
        ...PairFields
      }
    }`
  return gql(queryString)
}

interface PairFields {
  id: string
  txCount: string
  token0: {
    id: string
    symbol: string
    name: string
    totalLiquidity: string
    derivedETH: string
  }
  token1: {
    id: string
    symbol: string
    name: string
    totalLiquidity: string
    derivedETH: string
  }
  reserve0: number
  reserve1: number
  reserveUSD: string
  totalSupply: number
  trackedReserveETH: string
  reserveETH: string
  volumeUSD: string
  untrackedVolumeUSD: string
  token0Price: string
  token1Price: string
  createdAtTimestamp: number
}

interface PairHistoricalFields {
  id: string
  reserveUSD: string
  trackedReserveETH: string
  volumeUSD: string
  untrackedVolumeUSD: string
}

interface PairsBulkResponse {
  pairs: PairFields[]
}

interface PairHistoricalDataResponse {
  pairs: PairHistoricalFields[]
}

/**
 * Fetch top addresses by volume
 */
export function usePoolDatas(pairAddresses: string[]): {
  loading: boolean
  error: boolean
  data:
    | {
        [address: string]: PoolData
      }
    | undefined
} {
  const { chainId } = useActiveWeb3React()

  // get client
  const { dataClient } = useClients()
  const ethPrices = useEthPrices()

  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()
  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])
  const [block24, block48, blockWeek] = blocks ?? []

  const { loading, error, data } = useQuery<PairsBulkResponse>(PAIRS_BULK, {
    client: dataClient,
    variables: { pairAddresses },
  })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery<PairHistoricalDataResponse>(PAIRS_HISTORICAL_BULK(block24?.number, pairAddresses), {
    client: dataClient,
    fetchPolicy: 'cache-first',
  })
  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = useQuery<PairHistoricalDataResponse>(PAIRS_HISTORICAL_BULK(block48?.number, pairAddresses), {
    client: dataClient,
    fetchPolicy: 'cache-first',
  })
  const {
    loading: loadingWeek,
    error: errorWeek,
    data: dataWeek,
  } = useQuery<PairHistoricalDataResponse>(PAIRS_HISTORICAL_BULK(blockWeek?.number, pairAddresses), {
    client: dataClient,
    fetchPolicy: 'cache-first',
  })

  const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek)

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  const parsed = data?.pairs
    ? data.pairs.reduce((accum: { [address: string]: PairFields }, pairData) => {
        accum[pairData.id] = pairData
        return accum
      }, {})
    : {}

  const parsed24 = data24?.pairs
    ? data24.pairs.reduce((accum: { [address: string]: PairHistoricalFields }, cur: PairHistoricalFields) => {
        return { ...accum, [cur.id]: cur }
      }, {})
    : {}
  const parsed48 = data48?.pairs
    ? data48.pairs.reduce((accum: { [address: string]: PairHistoricalFields }, cur: PairHistoricalFields) => {
        return { ...accum, [cur.id]: cur }
      }, {})
    : {}
  const parsedWeek = dataWeek?.pairs
    ? dataWeek.pairs.reduce((accum: { [address: string]: PairHistoricalFields }, cur: PairHistoricalFields) => {
        return { ...accum, [cur.id]: cur }
      }, {})
    : {}

  const pairData =
    data &&
    data.pairs.reduce((accum: { [address: string]: PoolData }, pair) => {
      const current = parsed?.[pair.id]
      const history24 = parsed24?.[pair.id]
      const history48 = parsed48?.[pair.id]
      const historyWeek = parsedWeek?.[pair.id]

      const [volumeUSD, volumeUSDChange] =
        current && history24 && history48
          ? get2DayChange(current.volumeUSD, history24.volumeUSD, history48.volumeUSD)
          : current
          ? [parseFloat(current.volumeUSD), 0]
          : [0, 0]

      const [volumeUntracked, volumeUntrackedChange] =
        current && history24 && history48
          ? get2DayChange(current.untrackedVolumeUSD, history24.untrackedVolumeUSD, history48.untrackedVolumeUSD)
          : current
          ? [parseFloat(current.untrackedVolumeUSD), 0]
          : [0, 0]

      const volumeUSDWeek =
        current && historyWeek
          ? parseFloat(current.volumeUSD) - parseFloat(historyWeek.volumeUSD)
          : current
          ? parseFloat(current.volumeUSD)
          : 0

      const volumeUntrackedWeek =
        current && historyWeek
          ? parseFloat(current.untrackedVolumeUSD) - parseFloat(historyWeek.untrackedVolumeUSD)
          : current
          ? parseFloat(current.untrackedVolumeUSD)
          : 0

      const trackedReserveUSD = ethPrices?.currentPrice
        ? parseFloat(current.trackedReserveETH) * ethPrices?.currentPrice
        : 0

      const liquidityUSDChange = current && history24 ? getPercentChange(current.reserveUSD, history24.reserveUSD) : 0

      const tvlUSD =
        current && current.reserveUSD ? parseFloat(current.reserveUSD) : parseFloat(String(trackedReserveUSD))

      const fees =
        volumeUSD || volumeUSD === 0
          ? volumeUSD === 0 && !!volumeUntracked
            ? volumeUntracked * 0.003
            : volumeUSD * 0.003
          : 0

      const tvlUSDChange =
        current && history24
          ? ((parseFloat(current.reserveUSD) - parseFloat(history24.reserveUSD)) / parseFloat(history24.reserveUSD)) *
            100
          : 0

      if (current) {
        accum[pair.id] = {
          address: pair.id,
          fees,
          token0: {
            address: pair.token0.id,
            name: formatTokenName(pair.token0.id, pair.token0.name, chainId),
            symbol: formatTokenSymbol(pair.token0.id, pair.token0.symbol, chainId),
            derivedETH: parseFloat(pair.token0.derivedETH),
          },
          token1: {
            address: pair.token1.id,
            name: formatTokenName(pair.token1.id, pair.token1.name, chainId),
            symbol: formatTokenSymbol(pair.token1.id, pair.token1.symbol, chainId),
            derivedETH: parseFloat(pair.token1.derivedETH),
          },
          reserve0: pair.reserve0,
          reserve1: pair.reserve1,
          reserveUSD: parseFloat(pair.reserveUSD),
          token0Price: parseFloat(pair.token0Price),
          token1Price: parseFloat(pair.token1Price),
          volumeUSD,
          volumeUSDChange,
          volumeUSDWeek,
          volumeUntracked,
          volumeUntrackedChange,
          volumeUntrackedWeek,
          tvlUSD,
          tvlUSDChange,
          trackedReserveUSD,
          liquidityUSDChange,
          totalSupply: pair.totalSupply,
          createdAtTimestamp: current.createdAtTimestamp,
        }
      }
      return accum
    }, {})

  return {
    loading: anyLoading,
    error: anyError,
    data: pairData,
  }
}
