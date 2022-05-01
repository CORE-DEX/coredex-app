import 'inter-ui'
import '@reach/dialog/styles.css'

import { ApolloProvider } from '@apollo/client/react'
import { createWeb3ReactRoot, Web3ReactProvider } from '@web3-react/core'
import { client } from 'apollo/client'
import React, { StrictMode } from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import getLibrary from 'utils/getLibrary'

import { NetworkContextName } from './constants/misc'
import App from './pages/App'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'
import store from './state'
import ApplicationUpdater from './state/application/updater'
import ListUpdater from './state/lists/updater'
import MulticallUpdater from './state/multicall/updater'
import PoolUpdater from './state/pools/updater'
import ProtocolUpdater from './state/protocol/updater'
import TokenUpdater from './state/tokens/updater'
import TransactionUpdater from './state/transactions/updater'
import ThemeProvider, { FixedGlobalStyle, ThemedGlobalStyle } from './theme'

const Web3ProviderNetwork = createWeb3ReactRoot(NetworkContextName)

if (!!window.ethereum) {
  window.ethereum.autoRefreshOnNetworkChange = false
}

function Updaters() {
  return (
    <>
      <ApplicationUpdater />
      <ListUpdater />
      <PoolUpdater />
      <ProtocolUpdater />
      <TokenUpdater />
      <MulticallUpdater />
      <TransactionUpdater />
    </>
  )
}

ReactDOM.render(
  <StrictMode>
    <FixedGlobalStyle />
    <ApolloProvider client={client}>
      <Provider store={store}>
        <HashRouter>
          <Web3ReactProvider getLibrary={getLibrary}>
            <Web3ProviderNetwork getLibrary={getLibrary}>
              <Updaters />
              <ThemeProvider>
                <ThemedGlobalStyle />
                <App />
              </ThemeProvider>
            </Web3ProviderNetwork>
          </Web3ReactProvider>
        </HashRouter>
      </Provider>
    </ApolloProvider>
  </StrictMode>,
  document.getElementById('root')
)

if (process.env.REACT_APP_SERVICE_WORKER !== 'false') {
  serviceWorkerRegistration.register()
}
