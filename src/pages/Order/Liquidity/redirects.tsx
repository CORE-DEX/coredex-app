import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'

import Order from '../index'

export function RedirectDuplicateTokenIds(
  props: RouteComponentProps<{ addCurrencyIdA: string; addCurrencyIdB: string }>
) {
  const {
    match: {
      params: { addCurrencyIdA, addCurrencyIdB },
    },
  } = props

  if (addCurrencyIdA && addCurrencyIdB && addCurrencyIdA.toLowerCase() === addCurrencyIdB.toLowerCase()) {
    return <Redirect to={`/order?mode=add&currencyIdA=${addCurrencyIdA}`} />
  }

  return <Order />
}
