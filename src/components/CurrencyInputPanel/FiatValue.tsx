import { Currency, CurrencyAmount, Percent } from '@core-dex/sdk'
import useTheme from 'hooks/useTheme'
import React, { useMemo } from 'react'
import { Text } from 'rebass'
import { warningSeverity } from 'utils/prices'

import { TYPE } from '../../theme'
import HoverInlineText from '../HoverInlineText'
import { MouseoverTooltip } from '../Tooltip'

export function FiatValue({
  fiatValue,
  priceImpact,
}: {
  fiatValue: CurrencyAmount<Currency> | null | undefined
  priceImpact?: Percent
}) {
  const theme = useTheme()
  const priceImpactColor = useMemo(() => {
    if (!priceImpact) return undefined
    if (priceImpact.lessThan('0')) return theme.green1
    const severity = warningSeverity(priceImpact)
    if (severity < 1) return theme.text3
    if (severity < 3) return theme.yellow1
    return theme.red1
  }, [priceImpact, theme.green1, theme.red1, theme.text3, theme.yellow1])

  return (
    <TYPE.body fontSize={14} color={fiatValue ? theme.text2 : theme.text4}>
      {fiatValue ? (
        <Text>
          ~$
          <HoverInlineText text={fiatValue?.toSignificant(6, { groupSeparator: ',' })} />
        </Text>
      ) : (
        ''
      )}
      {priceImpact ? (
        <span style={{ color: priceImpactColor }}>
          {' '}
          <MouseoverTooltip text={`The estimated difference between the USD values of input and output amounts.`}>
            ({priceImpact.multiply(-1).toSignificant(3)}%)
          </MouseoverTooltip>
        </span>
      ) : null}
    </TYPE.body>
  )
}
