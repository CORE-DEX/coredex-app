import { configureStore } from '@reduxjs/toolkit'
import { load, save } from 'redux-localstorage-simple'

import application from './application/reducer'
import burn from './burn/reducer'
import { updateVersion } from './global/actions'
import lists from './lists/reducer'
import mint from './mint/reducer'
import multicall from './multicall/reducer'
import pools from './pools/reducer'
import protocol from './protocol/reducer'
import swap from './swap/reducer'
import tokens from './tokens/reducer'
import transactions from './transactions/reducer'
import userChart from './user/chart/reducer'
import user from './user/reducer'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists']

const store = configureStore({
  reducer: {
    application,
    burn,
    lists,
    mint,
    multicall,
    pools,
    protocol,
    tokens,
    user,
    userChart,
    transactions,
    swap,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: true }).concat(save({ states: PERSISTED_KEYS, debounce: 1000 })),
  preloadedState: load({ states: PERSISTED_KEYS, disableWarnings: process.env.NODE_ENV === 'test' }),
})

store.dispatch(updateVersion())

export default store

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
