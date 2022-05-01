import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import gql from 'graphql-tag'
import { PoolChartEntry } from 'state/pools/reducer'

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)
const ONE_DAY_UNIX = 24 * 60 * 60

export const PAIR_CHART = gql`
  query pairDayDatas($pairAddress: Bytes!, $skip: Int!) {
    pairDayDatas(first: 1000, skip: $skip, orderBy: date, orderDirection: asc, where: { pairAddress: $pairAddress }) {
      id
      date
      dailyVolumeToken0
      dailyVolumeToken1
      dailyVolumeUSD
      reserveUSD
    }
  }
`

interface ChartResults {
  pairDayDatas: {
    id: string
    date: number
    dailyVolumeToken0: string
    dailyVolumeToken1: string
    dailyVolumeUSD: string
    reserveUSD: string
  }[]
}

export async function fetchPoolChartData(pairAddress: string, client: ApolloClient<NormalizedCacheObject>) {
  let data: {
    id: string
    date: number
    dailyVolumeToken0: string
    dailyVolumeToken1: string
    dailyVolumeUSD: string
    reserveUSD: string
  }[] = []
  const utcEndTime = dayjs.utc()
  const utcStartTime = utcEndTime.subtract(1, 'year').startOf('minute')
  const startTimestamp = utcStartTime.unix() - 1
  const endTimestamp = dayjs.utc().unix()

  let error = false
  let skip = 0
  let allFound = false

  try {
    while (!allFound) {
      const {
        data: chartResData,
        error,
        loading,
      } = await client.query<ChartResults>({
        query: PAIR_CHART,
        variables: {
          pairAddress: pairAddress,
          skip,
        },
        fetchPolicy: 'cache-first',
      })
      if (!loading) {
        skip += 1000
        if (chartResData?.pairDayDatas.length < 1000 || error) {
          allFound = true
        }
        if (chartResData) {
          data = data.concat(chartResData.pairDayDatas)
        }
      }
    }
  } catch (e) {
    console.log('error : ' + e)
    error = true
  }

  if (data) {
    const formattedExisting = data.reduce((accum: { [date: number]: PoolChartEntry }, dayData) => {
      const roundedDate = parseInt((dayData.date / ONE_DAY_UNIX).toFixed(0))
      accum[roundedDate] = {
        date: dayData.date,
        dailyVolumeUSD: parseFloat(dayData.dailyVolumeUSD),
        reserveUSD: parseFloat(dayData.reserveUSD),
      }
      return accum
    }, {})

    const firstEntry = formattedExisting[parseInt(Object.keys(formattedExisting)[0])]

    // fill in empty days ( there will be no day datas if no trades made that day )
    let timestamp = firstEntry?.date ?? startTimestamp
    let latestTvl = firstEntry?.reserveUSD ?? 0
    while (timestamp < endTimestamp - ONE_DAY_UNIX) {
      const nextDay = timestamp + ONE_DAY_UNIX
      const currentDayIndex = parseInt((nextDay / ONE_DAY_UNIX).toFixed(0))
      if (!Object.keys(formattedExisting).includes(currentDayIndex.toString())) {
        formattedExisting[currentDayIndex] = {
          date: nextDay,
          dailyVolumeUSD: 0,
          reserveUSD: latestTvl,
        }
      } else {
        latestTvl = formattedExisting[currentDayIndex].reserveUSD
      }
      timestamp = nextDay
    }

    const dateMap = Object.keys(formattedExisting).map((key) => {
      return formattedExisting[parseInt(key)]
    })

    return {
      data: dateMap,
      error: false,
    }
  } else {
    return {
      data: undefined,
      error,
    }
  }
}
