import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import weekOfYear from 'dayjs/plugin/weekOfYear'
import gql from 'graphql-tag'
import { TokenChartEntry } from 'state/tokens/reducer'

// format dayjs with the libraries that we need
dayjs.extend(utc)
dayjs.extend(weekOfYear)
const ONE_DAY_UNIX = 24 * 60 * 60

const TOKEN_CHART = gql`
  query tokenDayDatas($tokenAddr: String!, $skip: Int!) {
    tokenDayDatas(first: 1000, skip: $skip, orderBy: date, orderDirection: asc, where: { token: $tokenAddr }) {
      id
      date
      priceUSD
      totalLiquidityToken
      totalLiquidityUSD
      totalLiquidityETH
      dailyVolumeETH
      dailyVolumeToken
      dailyVolumeUSD
    }
  }
`

interface ChartResults {
  tokenDayDatas: {
    id: number
    date: number
    priceUSD: string
    totalLiquidityToken: string
    totalLiquidityUSD: string
    totalLiquidityETH: string
    dailyVolumeETH: string
    dailyVolumeToken: string
    dailyVolumeUSD: string
    mostLiquidPairs: any
  }[]
}

export async function fetchTokenChartData(address: string, client: ApolloClient<NormalizedCacheObject>) {
  let data: {
    id: number
    date: number
    priceUSD: string
    totalLiquidityToken: string
    totalLiquidityUSD: string
    totalLiquidityETH: string
    dailyVolumeETH: string
    dailyVolumeToken: string
    dailyVolumeUSD: string
    mostLiquidPairs: any
  }[] = []
  const utcEndTime = dayjs.utc()
  const utcStartTime = utcEndTime.subtract(1, 'year')
  const startTimestamp = utcStartTime.startOf('minute').unix() - 1
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
        query: TOKEN_CHART,
        variables: {
          tokenAddr: address,
          skip,
        },
        fetchPolicy: 'cache-first',
      })
      if (!loading) {
        if (chartResData.tokenDayDatas.length < 1000 || error) {
          allFound = true
        }
        skip += 1000
        if (chartResData) {
          data = data.concat(chartResData.tokenDayDatas)
        }
      }
    }
  } catch {
    console.log('error : ' + error)
    error = true
  }

  if (data) {
    const formattedExisting = data.reduce((accum: { [date: number]: TokenChartEntry }, dayData) => {
      const roundedDate = parseInt((dayData.date / ONE_DAY_UNIX).toFixed(0))
      accum[roundedDate] = {
        date: dayData.date,
        volumeUSD: parseFloat(dayData.dailyVolumeUSD),
        totalValueLockedUSD: parseFloat(dayData.totalLiquidityUSD),
      }
      return accum
    }, {})

    const firstEntry = formattedExisting[parseInt(Object.keys(formattedExisting)[0])]

    // fill in empty days ( there will be no day datas if no trades made that day )
    let timestamp = firstEntry?.date ?? startTimestamp
    let latestTvl = firstEntry?.totalValueLockedUSD ?? 0
    while (timestamp < endTimestamp - ONE_DAY_UNIX) {
      const nextDay = timestamp + ONE_DAY_UNIX
      const currentDayIndex = parseInt((nextDay / ONE_DAY_UNIX).toFixed(0))
      if (!Object.keys(formattedExisting).includes(currentDayIndex.toString())) {
        formattedExisting[currentDayIndex] = {
          date: nextDay,
          volumeUSD: 0,
          totalValueLockedUSD: latestTvl,
        }
      } else {
        latestTvl = formattedExisting[currentDayIndex].totalValueLockedUSD
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
