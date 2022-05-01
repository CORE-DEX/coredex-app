import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import useTheme from 'hooks/useTheme'
import React, { Dispatch, ReactNode, SetStateAction } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
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

const CustomBar = ({
  x,
  y,
  width,
  height,
  fill,
}: {
  x: number
  y: number
  width: number
  height: number
  fill: string
}) => {
  return (
    <g>
      <rect x={x} y={y} fill={fill} width={width} height={height} rx="2" />
    </g>
  )
}

const Chart = ({
  data,
  color = '#56B2A4',
  setValue,
  setLabel,
  value,
  label,
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
          <BarChart
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
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tickFormatter={(time) => dayjs(time).format('DD')}
              minTickGap={10}
            />
            {/* eslint-disable react/prop-types */}
            <Tooltip
              cursor={{ fill: theme.bg2 }}
              contentStyle={{ display: 'none' }}
              formatter={(value: number, name: string, props: { payload: { time: string; value: number } }) => {
                if (setValue && parsedValue !== props.payload.value) {
                  setValue(props.payload.value)
                }
                const formattedTime = dayjs(props.payload.time).format('MMM D, YYYY')
                if (setLabel && label !== formattedTime) setLabel(formattedTime)
              }}
            />
            <Bar
              dataKey="value"
              fill={color}
              shape={(props) => {
                return <CustomBar height={props.height} width={props.width} x={props.x} y={props.y} fill={color} />
              }}
            />
          </BarChart>
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
