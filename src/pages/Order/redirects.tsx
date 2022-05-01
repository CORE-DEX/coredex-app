import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'

// Redirects from the /order/:outputCurrency path to the /order?outputCurrency=:outputCurrency format
export function RedirectToOrder(props: RouteComponentProps<{ outputCurrency?: string; pool?: string }>) {
  const {
    location: { search },
    match: {
      params: { outputCurrency, pool },
    },
  } = props

  return (
    <Redirect
      to={{
        ...props.location,
        pathname: '/order',
        search: outputCurrency
          ? search && search.length > 1
            ? `${search}&outputCurrency=${outputCurrency}`
            : `?outputCurrency=${outputCurrency}`
          : search && search.length > 1
          ? `${search}&pool=${pool}`
          : `?pool=${pool}`,
      }}
    />
  )
}
