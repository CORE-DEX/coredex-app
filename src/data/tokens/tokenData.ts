import { useQuery } from '@apollo/client'
import gql from 'graphql-tag'
import { useBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { useEthPrices } from 'hooks/useEthPrices'
import { useActiveWeb3React } from 'hooks/web3'
import { useClients } from 'state/application/hooks'
import { TokenData } from 'state/tokens/reducer'
import { get2DayChange } from 'utils/data'
import { getPercentChange } from 'utils/data'
import { useDeltaTimestamps } from 'utils/queries'
import { formatTokenName, formatTokenSymbol } from 'utils/tokens'

export const TOKENS_BULK = (block: number | undefined, tokens: string[]) => {
  let tokenString = `[`
  tokens.map((token) => {
    return (tokenString += `"${token}",`)
  })
  tokenString += ']'
  const queryString = `
  query tokens {
    tokens(first: 50, where: {id_in: ${tokenString}}, ${block ? 'block: {number: ' + block + '}' : ''}  ) {
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
  }
  `
  return gql(queryString)
}

interface TokenFields {
  id: string
  name: string
  symbol: string
  derivedETH: number
  tradeVolume: string
  tradeVolumeUSD: string
  untrackedVolumeUSD: string
  totalLiquidity: number
  txCount: number
}

interface TokenDataResponse {
  tokens: TokenFields[]
}

/**
 * Fetch top addresses by volume
 */
export function useFetchedTokenDatas(tokenAddresses: string[]): {
  loading: boolean
  error: boolean
  data:
    | {
        [address: string]: TokenData
      }
    | undefined
} {
  const { chainId } = useActiveWeb3React()
  const { dataClient } = useClients()

  // get blocks from historic timestamps
  const [t24, t48, tWeek] = useDeltaTimestamps()

  const { blocks, error: blockError } = useBlocksFromTimestamps([t24, t48, tWeek])
  const [block24, block48, blockWeek] = blocks ?? []
  const ethPrices = useEthPrices()

  const { loading, error, data } = useQuery<TokenDataResponse>(TOKENS_BULK(undefined, tokenAddresses), {
    client: dataClient,
  })

  const {
    loading: loading24,
    error: error24,
    data: data24,
  } = useQuery<TokenDataResponse>(TOKENS_BULK(parseInt(block24?.number), tokenAddresses), {
    client: dataClient,
  })

  const {
    loading: loading48,
    error: error48,
    data: data48,
  } = useQuery<TokenDataResponse>(TOKENS_BULK(parseInt(block48?.number), tokenAddresses), {
    client: dataClient,
  })

  const {
    loading: loadingWeek,
    error: errorWeek,
    data: dataWeek,
  } = useQuery<TokenDataResponse>(TOKENS_BULK(parseInt(blockWeek?.number), tokenAddresses), {
    client: dataClient,
  })

  const anyError = Boolean(error || error24 || error48 || blockError || errorWeek)
  const anyLoading = Boolean(loading || loading24 || loading48 || loadingWeek || !blocks)

  if (!ethPrices) {
    return {
      loading: true,
      error: false,
      data: undefined,
    }
  }

  // return early if not all data yet
  if (anyError || anyLoading) {
    return {
      loading: anyLoading,
      error: anyError,
      data: undefined,
    }
  }

  const parsed = data?.tokens
    ? data.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed24 = data24?.tokens
    ? data24.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}
  const parsed48 = data48?.tokens
    ? data48.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}

  const parsedWeek = dataWeek?.tokens
    ? dataWeek.tokens.reduce((accum: { [address: string]: TokenFields }, poolData) => {
        accum[poolData.id] = poolData
        return accum
      }, {})
    : {}

  // format data and calculate daily changes
  const formatted = tokenAddresses.reduce((accum: { [address: string]: TokenData }, address) => {
    const current: TokenFields | undefined = parsed[address]
    const oneDay: TokenFields | undefined = parsed24[address]
    const twoDay: TokenFields | undefined = parsed48[address]
    const week: TokenFields | undefined = parsedWeek[address]

    const [volumeUSD, volumeUSDChange] =
      current && oneDay && twoDay
        ? get2DayChange(current.tradeVolumeUSD, oneDay.tradeVolumeUSD, twoDay.tradeVolumeUSD)
        : current
        ? [parseFloat(current.tradeVolumeUSD), 0]
        : [0, 0]

    const volumeUSDWeek =
      current && week
        ? parseFloat(current.tradeVolumeUSD) - parseFloat(week.tradeVolumeUSD)
        : current
        ? parseFloat(current.tradeVolumeUSD)
        : 0

    const currentTotalValueLockedUSD = current?.totalLiquidity * ethPrices.currentPrice * current?.derivedETH
    const oneDayTotalValueLockedUSD = oneDay?.totalLiquidity * ethPrices.currentPrice * oneDay?.derivedETH
    const tvlUSD = current ? currentTotalValueLockedUSD : 0
    const tvlUSDChange = getPercentChange(currentTotalValueLockedUSD.toString(), oneDayTotalValueLockedUSD.toString())
    const priceUSD = current ? parseFloat(current.derivedETH.toString()) * ethPrices.currentPrice : 0
    const priceUSDOneDay = oneDay ? parseFloat(oneDay.derivedETH.toString()) * ethPrices.oneDayBackPrice : 0
    const priceUSDChange =
      priceUSD && priceUSDOneDay ? getPercentChange(priceUSD.toString(), priceUSDOneDay.toString()) : 0
    const txCount = current && oneDay ? current.txCount - oneDay.txCount : current ? current.txCount : 0

    const [oneDayVolumeUT] =
      current && oneDay && twoDay
        ? get2DayChange(current.untrackedVolumeUSD, oneDay.untrackedVolumeUSD, twoDay.untrackedVolumeUSD)
        : current
        ? [parseFloat(current.untrackedVolumeUSD), 0]
        : [0, 0]

    accum[address] = {
      exists: !!current,
      address,
      name: current ? formatTokenName(address, current.name, chainId) : '',
      symbol: current ? formatTokenSymbol(address, current.symbol, chainId) : '',
      volumeUSD,
      volumeUSDChange,
      volumeUSDWeek,
      txCount,
      tvlUSD,
      tvlUSDChange,
      priceUSD,
      priceUSDChange,
      oneDayVolumeUT,
    }

    return accum
  }, {})

  return {
    loading: anyLoading,
    error: anyError,
    data: formatted,
  }
}
