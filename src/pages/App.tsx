import Header from 'components/Header'
import Polling from 'components/Header/Polling'
import URLWarning from 'components/Header/URLWarning'
import { LocalLoader } from 'components/Loader'
import Popups from 'components/Popups'
import Web3ReactManager from 'components/Web3ReactManager'
import React, { Suspense, useEffect, useState } from 'react'
import { Route, Switch } from 'react-router-dom'
import { useSubgraphStatus } from 'state/application/hooks'
import styled from 'styled-components'

import Account from './Account'
import Home from './Home'
import Market from './Market'
import Order from './Order'
import { RedirectDuplicateTokenIds } from './Order/Liquidity/redirects'
import { RedirectToOrder } from './Order/redirects'

const AppWrapper = styled.div`
  display: flex;
  flex-flow: column;
  align-items: center;
  overflow-x: hidden;
  min-height: 100vh;
`

const HeaderWrapper = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  width: 100%;
  position: fixed;
  justify-content: space-between;
  z-index: 2;
`

const BodyWrapper = styled.div<{ warningActive?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-top: 25px;
  margin-top: ${({ warningActive }) => (warningActive ? '113px' : '73px')};
  align-items: center;
  flex: 1;
  overflow-y: auto;
  z-index: 1;

  @media (max-width: 1080px) {
    padding-top: 2rem;
    margin-top: 150px;
  }
`

const Marginer = styled.div`
  width: 100%;
  height: 35px;
`

const Hide1080 = styled.div`
  @media (max-width: 1080px) {
    display: none;
  }
`

const Show1080 = styled.div`
  @media (max-width: 1080px) {
    display: flex;
  }
`

const WarningWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
`

const WarningBanner = styled.div`
  background-color: ${({ theme }) => theme.bg3};
  padding: 1rem;
  color: white;
  font-size: 14px;
  width: 100%;
  text-align: center;
  font-weight: 500;
`

const BLOCK_DIFFERENCE_THRESHOLD = 30

export default function App() {
  // pretend load buffer
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setTimeout(() => setLoading(false), 1300)
  }, [])

  // subgraph health
  const [subgraphStatus] = useSubgraphStatus()

  const showNotSyncedWarning =
    subgraphStatus.headBlock && subgraphStatus.syncedBlock
      ? subgraphStatus.headBlock - subgraphStatus.syncedBlock > BLOCK_DIFFERENCE_THRESHOLD
      : false

  return (
    <Suspense fallback={null}>
      {loading ? (
        <LocalLoader fill={true} />
      ) : (
        <Web3ReactManager>
          <AppWrapper>
            <URLWarning />
            <HeaderWrapper>
              {showNotSyncedWarning && (
                <WarningWrapper>
                  <WarningBanner>
                    {`Warning: 
                  Data has only synced to block ${subgraphStatus.syncedBlock} (out of ${subgraphStatus.headBlock}). Please check back soon.`}
                  </WarningBanner>
                </WarningWrapper>
              )}
              <Header />
            </HeaderWrapper>

            <BodyWrapper warningActive={showNotSyncedWarning}>
              <Popups />
              <Polling />
              <Switch>
                <Route exact path="/" component={Home} />

                <Route exact strict path="/market" component={Market} />

                <Route exact strict path="/order/:outputCurrency" component={RedirectToOrder} />
                <Route exact strict path="/order/:pool" component={RedirectToOrder} />
                <Route
                  exact
                  strict
                  path="/order/:addCurrencyIdA?/:addCurrencyIdB?"
                  component={RedirectDuplicateTokenIds}
                />
                <Route exact strict path="/order" component={Order} />

                <Route exact strict path="/account" component={Account} />
              </Switch>
              <Show1080>
                <Marginer />
              </Show1080>
            </BodyWrapper>
          </AppWrapper>
        </Web3ReactManager>
      )}
    </Suspense>
  )
}
