import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import { darken } from 'polished'
import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import styled from 'styled-components'

import Card from '../Card'
import { RowBetween } from '../Row'
dayjs.extend(utc)

const DEFAULT_HEIGHT = 180

const Wrapper = styled(Card)<{ chartDisplay?: string; marginBottom?: string; padding?: string; borderWidth?: string }>`
  width: 100%;
  height: ${({ chartDisplay }) => (chartDisplay === 'overview' ? 'calc((100% - 225px) / 2)' : 'calc(100% - 68px)')};
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
  setLabel?: Dispatch<SetStateAction<string | undefined>> // used for label of valye
  value?: number
  label?: string
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
  chartDisplay?: string
  padding?: string | undefined
  borderWidth?: string | undefined
  marginBottom?: string | undefined
} & React.HTMLAttributes<HTMLDivElement>

const Chart = ({
  data,
  color = '#56B2A4',
  value,
  label,
  setValue,
  setLabel,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  minHeight = DEFAULT_HEIGHT,
  chartDisplay,
  padding,
  borderWidth,
  marginBottom,
  ...rest
}: LineChartProps) => {
  const theme = useTheme()
  const parsedValue = value

  return (
    <>
      <TitleWrapper>
        <RowBetween>
          {topLeft ?? null}
          {topRight ?? null}
        </RowBetween>
      </TitleWrapper>
      <Wrapper
        chartDisplay={chartDisplay}
        minHeight={minHeight}
        marginBottom={marginBottom}
        padding={padding}
        borderWidth={borderWidth}
        {...rest}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            onMouseLeave={() => {
              setLabel && setLabel(undefined)
              setValue && setValue(undefined)
            }}
          >
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={darken(0.36, color)} stopOpacity={0.5} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickFormatter={(time) => dayjs(time).format('DD')}
              minTickGap={10}
            />
            {/* eslint-disable react/prop-types */}
            <Tooltip
              cursor={{ stroke: theme.bg2 }}
              contentStyle={{ display: 'none' }}
              formatter={(value: number, name: string, props: { payload: { time: string; value: number } }) => {
                if (setValue && parsedValue !== props.payload.value) {
                  setValue(props.payload.value)
                }
                const formattedTime = dayjs(props.payload.time).format('MMM D, YYYY')
                if (setLabel && label !== formattedTime) setLabel(formattedTime)
              }}
            />
            <Area dataKey="value" type="monotone" stroke={color} fill="url(#gradient)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
        <RowBetween>
          {bottomLeft ?? null}
          {bottomRight ?? null}
        </RowBetween>
      </Wrapper>
    </>
  )
}

export default Chart
