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

export const PRICES_ETH_BY_BLOCK = (tokenAddress: string, blocks: any) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block: any) => `
      t${block.timestamp}:token(id:"${tokenAddress}", block: { number: ${block.number} }) { 
        derivedETH
      }
    `
  )

  queryString += '}'
  return gql(queryString)
}

export const PRICES_USD_BY_BLOCK = (blocks: any) => {
  let queryString = 'query blocks {'
  queryString += blocks.map(
    (block: any) => `
      b${block.timestamp}: bundle(id:"1", block: { number: ${block.number} }) { 
        ethPrice
      }
    `
  )

  queryString += '}'
  return gql(queryString)
}

interface PriceETHResults {
  [key: string]: {
    derivedETH: string
  }
}

interface PriceUSDResults {
  [key: string]: {
    ethPrice: string
  }
}

export async function fetchTokenPriceData(
  address: string,
  startTimestamp: number,
  interval = 3600,
  dataClient: ApolloClient<NormalizedCacheObject>,
  blockClient: ApolloClient<NormalizedCacheObject>
): Promise<{
  data: PriceChartEntry[]
  error: boolean
}> {
  // start and end bounds

  try {
    const endTimestamp = dayjs.utc().unix()

    if (!startTimestamp) {
      console.log('Error constructing price start timestamp')
      return {
        data: [],
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
        data: [],
        error: false,
      }
    }

    // fetch blocks based on timestamp
    const blocks = await getBlocksFromTimestamps(timestamps, blockClient, 500)
    if (!blocks || blocks.length === 0) {
      console.log('Error fetching blocks')
      return {
        data: [],
        error: false,
      }
    }

    let fetchedETHData: PriceETHResults = {}
    let fetchedUSDData: PriceUSDResults = {}
    let allFound = false
    let skip = 0
    const skipCount = 50

    while (!allFound) {
      let end = blocks.length
      if (skip + skipCount < blocks.length) {
        end = skip + skipCount
      }
      const sliced = blocks.slice(skip, end)
      const resultETH = await dataClient.query<PriceETHResults>({
        query: PRICES_ETH_BY_BLOCK(address, sliced),
        fetchPolicy: 'network-only',
      })
      const resultUSD = await dataClient.query<PriceUSDResults>({
        query: PRICES_USD_BY_BLOCK(sliced),
        fetchPolicy: 'network-only',
      })
      fetchedETHData = {
        ...fetchedETHData,
        ...resultETH.data,
      }
      fetchedUSDData = {
        ...fetchedUSDData,
        ...resultUSD.data,
      }
      const resultETHData = resultETH.data
      const resultUSDData = resultUSD.data
      if (resultETHData) {
        if (
          (Object.keys(resultETHData).length < skipCount && Object.keys(resultUSDData).length < skipCount) ||
          skip + skipCount > blocks.length
        ) {
          allFound = true
        } else {
          skip += skipCount
        }
      }
    }

    const values: {
      timestamp: string
      derivedETH: number
      priceUSD: number | null
    }[] = []
    for (const row in fetchedETHData) {
      const timestamp = row.split('t')[1]
      const derivedETH = parseFloat(fetchedETHData[row]?.derivedETH)
      if (timestamp) {
        values.push({
          timestamp,
          derivedETH,
          priceUSD: null,
        })
      }
    }

    let index = 0
    for (const brow in fetchedUSDData) {
      const timestamp = brow.split('b')[1]
      if (timestamp) {
        values[index].priceUSD = parseFloat(fetchedUSDData[brow]?.ethPrice) * values[index]?.derivedETH
        index += 1
      }
    }

    const formattedHistory: PriceChartEntry[] = []

    for (let i = 0; i < values.length - 1; i++) {
      formattedHistory.push({
        time: Number(values[i].timestamp),
        open: values[i].priceUSD,
        close: values[i + 1].priceUSD,
        high: values[i + 1].priceUSD,
        low: values[i].priceUSD,
      })
    }

    return {
      data: formattedHistory,
      error: false,
    }
  } catch (e) {
    console.log(e)
    return {
      data: [],
      error: true,
    }
  }
}
