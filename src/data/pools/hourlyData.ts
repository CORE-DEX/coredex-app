import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import gql from 'graphql-tag'
import { getBlocksFromTimestamps } from 'hooks/useBlocksFromTimestamps'

import { PriceChartEntry } from '../../types'

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)

export const HOURLY_PAIR_RATES = (pairAddress: string, blocks: any[]) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block) => `
        t${block.timestamp}: pair(id:"${pairAddress}", block: { number: ${block.number} }) { 
          token0Price
          token1Price
        }
      `
  )

  queryString += '}'
  return gql(queryString)
}

interface PairRatesResults {
  [key: string]: {
    token0Price: string
    token1Price: string
  }
}

export async function fetchHourlyData(
  address: string,
  startTimestamp: number,
  interval: number,
  dataClient: ApolloClient<NormalizedCacheObject>,
  blockClient: ApolloClient<NormalizedCacheObject>
): Promise<{
  data: { rate0: PriceChartEntry[]; rate1: PriceChartEntry[] }
  error: boolean
}> {
  // start and end bounds

  try {
    const endTimestamp = dayjs.utc().unix()

    if (!startTimestamp) {
      console.log('Error constructing price start timestamp')
      return {
        data: { rate0: [], rate1: [] },
        error: false,
      }
    }

    // create an array of hour start times until we reach current hour
    const timestamps = []
    let time = startTimestamp
    while (time <= endTimestamp) {
      timestamps.push(time)
      time += interval
    }

    // backout if invalid timestamp format
    if (timestamps.length === 0) {
      return {
        data: { rate0: [], rate1: [] },
        error: false,
      }
    }

    // fetch blocks based on timestamp
    const blocks = await getBlocksFromTimestamps(timestamps, blockClient, 500)
    if (!blocks || blocks.length === 0) {
      console.log('Error fetching blocks')
      return {
        data: { rate0: [], rate1: [] },
        error: false,
      }
    }

    let fetchedHourlyData: PairRatesResults = {}
    let allFound = false
    let skip = 0
    const skipCount = 50

    while (!allFound) {
      let end = blocks.length
      if (skip + skipCount < blocks.length) {
        end = skip + skipCount
      }
      const sliced = blocks.slice(skip, end)
      const result = await dataClient.query<PairRatesResults>({
        query: HOURLY_PAIR_RATES(address, sliced),
        fetchPolicy: 'network-only',
      })
      fetchedHourlyData = {
        ...fetchedHourlyData,
        ...result.data,
      }
      const resultHourlyData = result.data
      if (resultHourlyData) {
        if (Object.keys(resultHourlyData).length < skipCount || skip + skipCount > blocks.length) {
          allFound = true
        } else {
          skip += skipCount
        }
      }
    }

    const values: {
      timestamp: string
      rate0: number
      rate1: number
    }[] = []
    for (const row in fetchedHourlyData) {
      const timestamp = row.split('t')[1]
      if (timestamp) {
        values.push({
          timestamp,
          rate0: parseFloat(fetchedHourlyData[row]?.token0Price),
          rate1: parseFloat(fetchedHourlyData[row]?.token1Price),
        })
      }
    }

    const formattedHistoryRate0: PriceChartEntry[] = []
    const formattedHistoryRate1: PriceChartEntry[] = []

    for (let i = 0; i < values.length - 1; i++) {
      formattedHistoryRate0.push({
        time: Number(values[i].timestamp),
        open: values[i].rate0,
        close: values[i + 1].rate0,
        high: values[i + 1].rate0,
        low: values[i].rate0,
      })
      formattedHistoryRate1.push({
        time: Number(values[i].timestamp),
        open: values[i].rate1,
        close: values[i + 1].rate1,
        high: values[i + 1].rate1,
        low: values[i].rate1,
      })
    }

    return {
      data: { rate0: formattedHistoryRate0, rate1: formattedHistoryRate1 },
      error: false,
    }
  } catch (e) {
    console.log(e)
    return {
      data: { rate0: [], rate1: [] },
      error: true,
    }
  }
}
