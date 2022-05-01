import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import { createChart, IChartApi } from 'lightweight-charts'
import React, { Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

import Card from '../Card'
import { RowBetween } from '../Row'

dayjs.extend(utc)

const DEFAULT_HEIGHT = 180

const Wrapper = styled(Card)<{ marginBottom?: string; padding?: string; borderWidth?: string }>`
  width: 100%;
  height: calc(100% - 68px);
  margin-bottom: ${({ marginBottom }) => marginBottom ?? '0'};
  display: flex;
  background-color: ${({ theme }) => theme.bg0};
  padding: ${({ padding }) => (padding ? padding : '0 1rem 1rem 1rem')};
  border-width: ${({ borderWidth }) => (borderWidth ? borderWidth : '0 2px 2px 2px')};
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

const TitleWrapper = styled(Card)`
  width: 100%;
  background-color: ${({ theme }) => theme.bg0};
  padding: 1rem 1rem 0 1rem;
  border-width: 2px 2px 0 2px;
`

export type LineChartProps = {
  data: any[]
  color?: string | undefined
  height?: number | undefined
  minHeight?: number
  setValue?: Dispatch<SetStateAction<number | undefined>> // used for value on hover
  setLabel?: Dispatch<SetStateAction<string | undefined>> // used for value label on hover
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
  padding?: string | undefined
  borderWidth?: string | undefined
  marginBottom?: string | undefined
} & React.HTMLAttributes<HTMLDivElement>

const CandleChart = ({
  data,
  color = '#56B2A4',
  setValue,
  setLabel,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  height = DEFAULT_HEIGHT,
  minHeight = DEFAULT_HEIGHT,
  padding,
  borderWidth,
  marginBottom,
  ...rest
}: LineChartProps) => {
  const theme = useTheme()
  const textColor = theme.text3
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartCreated, setChart] = useState<IChartApi | undefined>()

  const handleResize = useCallback(() => {
    if (chartCreated && chartRef?.current?.parentElement) {
      chartCreated.resize(
        chartRef.current.parentElement.clientWidth - 32,
        chartRef.current?.parentElement?.clientHeight - 32
      )
      chartCreated.timeScale().fitContent()
      chartCreated.timeScale().scrollToPosition(0, false)
    }
  }, [chartCreated, chartRef])

  // add event listener for resize
  const isClient = typeof window === 'object'
  useEffect(() => {
    if (!isClient) {
      return undefined
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isClient, chartRef, handleResize]) // Empty array ensures that effect is only run on mount and unmount

  // if chart not instantiated in canvas, create it
  useEffect(() => {
    if (!chartCreated && data && !!chartRef?.current?.parentElement) {
      const chart = createChart(chartRef.current, {
        height: chartRef.current?.parentElement?.clientHeight - 32,
        width: chartRef.current.parentElement.clientWidth - 32,
        layout: {
          backgroundColor: 'transparent',
          textColor: '#565A69',
          fontFamily: 'Inter var',
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          borderVisible: false,
        },
        timeScale: {
          borderVisible: false,
          secondsVisible: true,
          tickMarkFormatter: (unixTime: number) => {
            return dayjs.unix(unixTime).format('MM/DD h:mm A')
          },
        },
        watermark: {
          visible: false,
        },
        grid: {
          horzLines: {
            visible: false,
          },
          vertLines: {
            visible: false,
          },
        },
        crosshair: {
          horzLine: {
            visible: false,
            labelVisible: false,
          },
          mode: 1,
          vertLine: {
            visible: true,
            labelVisible: false,
            style: 3,
            width: 1,
            color: '#505050',
            labelBackgroundColor: color,
          },
        },
      })

      chart.timeScale().fitContent()
      setChart(chart)
    }
  }, [color, chartCreated, data, height, setValue, textColor, theme])

  useEffect(() => {
    if (chartCreated && data) {
      const series = chartCreated.addCandlestickSeries({
        upColor: 'green',
        downColor: 'red',
        borderDownColor: 'red',
        borderUpColor: 'green',
        wickDownColor: 'red',
        wickUpColor: 'green',
      })

      series.setData(data)

      // update the title when hovering on the chart
      chartCreated.subscribeCrosshairMove(function (param) {
        if (
          chartRef?.current &&
          (param === undefined ||
            param.time === undefined ||
            (param && param.point && param.point.x < 0) ||
            (param && param.point && param.point.x > chartRef.current.clientWidth) ||
            (param && param.point && param.point.y < 0) ||
            (param && param.point && param.point.y > chartRef.current.clientHeight))
        ) {
          // reset values
          setValue && setValue(undefined)
          setLabel && setLabel(undefined)
        } else if (series && param) {
          const timestamp = param.time as number
          const time = dayjs.unix(timestamp).utc().format('MMM D, YYYY h:mm A') + ' (UTC)'
          const parsed = param.seriesPrices.get(series) as { open: number } | undefined
          setValue && setValue(parsed?.open)
          setLabel && setLabel(time)
        }
      })
    }
  }, [chartCreated, color, data, height, setValue, setLabel, theme.bg0])

  return (
    <>
      <TitleWrapper>
        <RowBetween>
          {topLeft ?? null}
          {topRight ?? null}
        </RowBetween>
      </TitleWrapper>
      <Wrapper minHeight={minHeight} marginBottom={marginBottom} padding={padding} borderWidth={borderWidth}>
        <div ref={chartRef} id={'candle-chart'} {...rest} />
        <RowBetween>
          {bottomLeft ?? null}
          {bottomRight ?? null}
        </RowBetween>
      </Wrapper>
    </>
  )
}

export default CandleChart
