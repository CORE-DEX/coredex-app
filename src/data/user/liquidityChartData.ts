import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import gql from 'graphql-tag'
import { LiquidityChartEntry } from 'state/user/chart/reducer'

import { LPSnapshots } from '../../types'

dayjs.extend(utc)

const PAIR_DAY_DATA_BULK = (pairs: string[], startTimestamp: number) => {
  let pairsString = `[`
  pairs.map((pair) => {
    return (pairsString += `"${pair}"`)
  })
  pairsString += ']'
  const queryString = `
      query days {
        pairDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { pairAddress_in: ${pairsString}, date_gt: ${startTimestamp} }) {
          id
          pairAddress
          date
          dailyVolumeToken0
          dailyVolumeToken1
          dailyVolumeUSD
          totalSupply
          reserveUSD
        }
      } 
  `
  return gql(queryString)
}

export interface PairDayDatasResult {
  pairDayDatas: {
    id: string
    pairAddress: string
    date: number
    dailyVolumeToken0: string
    dailyVolumeToken1: string
    dailyVolumeUSD: string
    totalSupply: string
    reserveUSD: string
  }[]
}

export async function fetchLiquidityChartData(
  account: string,
  client: ApolloClient<NormalizedCacheObject>,
  history: LPSnapshots[]
): Promise<{ data: LiquidityChartEntry[] | undefined; error: boolean; loading: boolean }> {
  const utcEndTime = dayjs.utc()
  const utcStartTime = utcEndTime.subtract(1, 'year')
  const startTimestamp = utcStartTime.startOf('minute').unix() - 1

  const pairs: string[] = history.reduce((pairList: string[], position) => {
    return [...pairList, position.pair.id]
  }, [])

  const {
    data: pairDayDatas,
    error,
    loading,
  } = await client.query<PairDayDatasResult>({
    query: PAIR_DAY_DATA_BULK(pairs, startTimestamp),
    fetchPolicy: 'no-cache',
  })

  if (error) {
    return {
      data: undefined,
      error: true,
      loading: false,
    }
  }
  if (!loading && !pairDayDatas) {
    return {
      data: undefined,
      error: false,
      loading: true,
    }
  }

  const ownershipPerPair: {
    [pairId: string]: {
      lpTokenBalance: number
      timestamp: number
    }
  } = {}

  const chartData: LiquidityChartEntry[] = []
  if (pairDayDatas) {
    for (const index in pairDayDatas.pairDayDatas) {
      const dayTimestamp = pairDayDatas.pairDayDatas[index].date

      const relevantPositions = history

      for (const index in relevantPositions) {
        const position = relevantPositions[index]
        // case where pair not added yet
        if (!ownershipPerPair[position.pair.id]) {
          ownershipPerPair[position.pair.id] = {
            lpTokenBalance: position.liquidityTokenBalance,
            timestamp: position.timestamp,
          }
        }
        // case where more recent timestamp is found for pair
        if (ownershipPerPair[position.pair.id] && ownershipPerPair[position.pair.id].timestamp < position.timestamp) {
          ownershipPerPair[position.pair.id] = {
            lpTokenBalance: position.liquidityTokenBalance,
            timestamp: position.timestamp,
          }
        }
      }
      const relavantDayDatas = Object.keys(ownershipPerPair).map((pairAddress) => {
        // find last day data after timestamp update
        const dayDatasForThisPair = pairDayDatas.pairDayDatas.filter((dayData) => {
          return dayData.pairAddress === pairAddress
        })
        // find the most recent reference to pair liquidity data
        let mostRecent = dayDatasForThisPair[0]
        for (const index in dayDatasForThisPair) {
          const dayData = dayDatasForThisPair[index]
          if (dayData.date < dayTimestamp && dayData.date > mostRecent.date) {
            mostRecent = dayData
          }
        }
        return mostRecent
      })

      // now cycle through pair day datas, for each one find usd value = ownership[address] * reserveUSD
      const dailyUSD = relavantDayDatas.reduce((totalUSD, dayData) => {
        if (dayData) {
          return (totalUSD =
            totalUSD +
            (ownershipPerPair[dayData.pairAddress]
              ? (ownershipPerPair[dayData.pairAddress].lpTokenBalance / parseFloat(dayData.totalSupply)) *
                parseFloat(dayData.reserveUSD)
              : 0))
        } else {
          return totalUSD
        }
      }, 0)

      chartData.push({
        date: dayTimestamp,
        volumeUSD: dailyUSD,
      })
    }
  }

  return { data: chartData, error: false, loading: false }
}
