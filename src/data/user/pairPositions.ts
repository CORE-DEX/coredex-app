import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import gql from 'graphql-tag'
import { getBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'
import { PoolData } from 'state/pools/reducer'
import { PositionChartEntry } from 'state/user/chart/reducer'

import { LPSnapshots } from '../../types'
import { getMetricsForPositionWindow } from './positionData'

dayjs.extend(utc)
const ONE_DAY_UNIX = 24 * 60 * 60

const SHARE_VALUE_PAIR = (pairAddress: string, blocks: any[]) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      t${block.timestamp}:pair(id:"${pairAddress}", block: { number: ${block.number} }) { 
        id
        reserve0
        reserve1
        reserveUSD
        totalSupply 
        token0{
          derivedETH
        }
        token1{
          derivedETH
        }
      }
    `
  )
  queryString += '}'
  return gql(queryString)
}

const SHARE_VALUE_BUNDLE = (blocks: any[]) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
      b${block.timestamp}: bundle(id:"1", block: { number: ${block.number} }) { 
        ethPrice
      }
    `
  )
  queryString += '}'
  return gql(queryString)
}

interface ShareValuePairResult {
  id: string
  reserve0: number
  reserve1: number
  reserveUSD: number
  totalSupply: number
  token0: {
    derivedETH: number
  }
  token1: {
    derivedETH: number
  }
}

interface ShareValueBundleResult {
  ethPrice: number
}

interface ShareValueResult {
  timestamp: number
  sharePriceUsd: number
  totalSupply: number
  reserve0: number
  reserve1: number
  reserveUSD: number
  token0DerivedETH: number
  token1DerivedETH: number
  roiUsd: number
  ethPrice: number
  token0PriceUSD: number
  token1PriceUSD: number
}

const initialPositionT1: LPSnapshots = {
  timestamp: 0,
  reserve0: 0,
  reserve1: 0,
  reserveUSD: 0,
  liquidityTokenBalance: 0,
  liquidityTokenTotalSupply: 0,
  token0PriceUSD: 0,
  token1PriceUSD: 0,
  pair: {
    id: '',
    reserve0: 0,
    reserve1: 0,
    reserveUSD: 0,
    token0: {
      id: '',
    },
    token1: {
      id: '',
    },
  },
}

export async function getShareValueOverTime(
  pairAddress: string,
  timestamps: number[],
  dataClient: ApolloClient<NormalizedCacheObject>,
  blockClient: ApolloClient<NormalizedCacheObject>
): Promise<ShareValueResult[] | undefined> {
  const blocks = await getBlocksFromTimestamps(timestamps, blockClient)

  const pairResult = await dataClient.query<ShareValuePairResult[]>({
    query: SHARE_VALUE_PAIR(pairAddress, blocks),
    fetchPolicy: 'cache-first',
  })
  const bundleResult = await dataClient.query<ShareValueBundleResult[]>({
    query: SHARE_VALUE_BUNDLE(blocks),
    fetchPolicy: 'cache-first',
  })

  let values: ShareValueResult[] | undefined = []
  if (pairResult && bundleResult) {
    for (const row in pairResult.data) {
      const timestamp = Number(row.split('t')[1])
      const sharePriceUsd = pairResult.data[row].reserveUSD / pairResult.data[row].totalSupply

      values.push({
        timestamp,
        sharePriceUsd,
        totalSupply: pairResult.data[row].totalSupply,
        reserve0: pairResult.data[row].reserve0,
        reserve1: pairResult.data[row].reserve1,
        reserveUSD: pairResult.data[row].reserveUSD,
        token0DerivedETH: pairResult.data[row].token0.derivedETH,
        token1DerivedETH: pairResult.data[row].token1.derivedETH,
        roiUsd: values && values[0] ? sharePriceUsd / values[0]['sharePriceUsd'] : 1,
        ethPrice: 0,
        token0PriceUSD: 0,
        token1PriceUSD: 0,
      })
    }

    let index = 0
    for (const brow in bundleResult.data) {
      const timestamp = brow.split('b')[1]
      if (timestamp) {
        values[index].ethPrice = bundleResult.data[brow].ethPrice
        values[index].token0PriceUSD = bundleResult.data[brow].ethPrice * values[index].token0DerivedETH
        values[index].token1PriceUSD = bundleResult.data[brow].ethPrice * values[index].token1DerivedETH
        index += 1
      }
    }
  } else {
    values = undefined
  }

  return values
}

export async function fetchHistoricalPairReturns(
  pairData: PoolData,
  pairSnapshots: LPSnapshots[] | undefined,
  ethPrice: number | undefined,
  dataClient: ApolloClient<NormalizedCacheObject>,
  blockClient: ApolloClient<NormalizedCacheObject>
): Promise<{ data: PositionChartEntry[] | undefined }> {
  const utcEndTime = dayjs.utc()
  const utcStartTime = utcEndTime.subtract(1, 'year')
  const startDateTimestamp = utcStartTime.startOf('day').unix() - 1

  let dayIndex: number = Math.round(startDateTimestamp / ONE_DAY_UNIX) // get unique day bucket unix
  const currentDayIndex: number = Math.round(dayjs.utc().unix() / ONE_DAY_UNIX)
  const sortedPositions = pairSnapshots?.sort((a, b) => {
    return a.timestamp > b.timestamp ? 1 : -1
  })
  if (sortedPositions) {
    if (sortedPositions[0].timestamp > startDateTimestamp) {
      dayIndex = Math.round(sortedPositions[0].timestamp / ONE_DAY_UNIX)
    }
  }

  const dayTimestamps = []
  while (dayIndex < currentDayIndex) {
    // only account for days where this pair existed
    if (dayIndex * ONE_DAY_UNIX >= pairData.createdAtTimestamp) {
      dayTimestamps.push(dayIndex * ONE_DAY_UNIX)
    }
    dayIndex = dayIndex + 1
  }

  const shareValues = await getShareValueOverTime(pairData.address, dayTimestamps, dataClient, blockClient)
  const shareValuesFormatted: { [timestamp: string]: ShareValueResult } = {}
  shareValues?.map((share) => {
    return (shareValuesFormatted[share.timestamp] = share)
  })

  const formattedHistory = []

  if (pairSnapshots && ethPrice) {
    // set the default position and data
    let positionT0 = pairSnapshots[0]
    let netFees = 0

    for (const index in dayTimestamps) {
      const dayTimestamp = dayTimestamps[index]
      const timestampCeiling = dayTimestamp + ONE_DAY_UNIX

      // for each change in position value that day, create a window and update
      const dailyChanges = pairSnapshots.filter((snapshot) => {
        return snapshot.timestamp < timestampCeiling && snapshot.timestamp > dayTimestamp
      })

      for (let i = 0; i < dailyChanges.length; i++) {
        const positionT1 = dailyChanges[i]
        const localReturns = getMetricsForPositionWindow(positionT0, positionT1)
        netFees = netFees + localReturns.fees
        positionT0 = positionT1
      }

      // now treat the end of the day as a hypothetical position
      let positionT1 = initialPositionT1
      if (!shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX]) {
        positionT1 = {
          timestamp: positionT0.timestamp,
          reserve0: pairData.reserve0,
          reserve1: pairData.reserve1,
          reserveUSD: pairData.reserveUSD,
          liquidityTokenBalance: positionT0.liquidityTokenBalance,
          liquidityTokenTotalSupply: pairData.totalSupply,
          token0PriceUSD: pairData.token0.derivedETH * ethPrice,
          token1PriceUSD: pairData.token1.derivedETH * ethPrice,
          pair: {
            id: pairData.address,
            reserve0: pairData.reserve0,
            reserve1: pairData.reserve1,
            reserveUSD: pairData.reserveUSD,
            token0: {
              id: pairData.token0.address,
            },
            token1: {
              id: pairData.token1.address,
            },
          },
        }
      }

      if (shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX]) {
        positionT1 = {
          ...positionT1,
          timestamp: shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX].timestamp,
          reserve0: shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX].reserve0,
          reserve1: shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX].reserve1,
          reserveUSD: shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX].reserveUSD,
          liquidityTokenTotalSupply: shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX].totalSupply,
          liquidityTokenBalance: positionT0.liquidityTokenBalance,
          token0PriceUSD: shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX].token0PriceUSD,
          token1PriceUSD: shareValuesFormatted[dayTimestamp + ONE_DAY_UNIX].token1PriceUSD,
          pair: {
            id: pairData.address,
            reserve0: pairData.reserve0,
            reserve1: pairData.reserve1,
            reserveUSD: pairData.reserveUSD,
            token0: {
              id: pairData.token0.address,
            },
            token1: {
              id: pairData.token1.address,
            },
          },
        }
        const currentLiquidityValue =
          (positionT1.liquidityTokenBalance / positionT1.liquidityTokenTotalSupply) * positionT1.reserveUSD
        const localReturns = getMetricsForPositionWindow(positionT0, positionT1)
        const localFees = netFees + localReturns.fees

        formattedHistory.push({
          date: dayTimestamp,
          usdValue: currentLiquidityValue,
          fees: localFees,
        })
      }
    }
  }

  return { data: formattedHistory }
}
