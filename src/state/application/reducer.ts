import { createReducer, nanoid } from '@reduxjs/toolkit'

import {
  addPopup,
  ApplicationModal,
  PopupContent,
  removePopup,
  setOpenModal,
  updateBlockNumber,
  updateChainId,
  updateSubgraphStatus,
} from './actions'

type PopupList = Array<{ key: string; show: boolean; content: PopupContent; removeAfterMs: number | null }>

export interface ApplicationState {
  // used by RTK-Query to build dynamic subgraph urls
  readonly chainId: number | null
  readonly blockNumber: { readonly [chainId: number]: number }
  readonly popupList: PopupList
  readonly openModal: ApplicationModal | null
  readonly subgraphStatus: {
    available: boolean | null
    syncedBlock: number | undefined
    headBlock: number | undefined
  }
}

const initialState: ApplicationState = {
  chainId: null,
  blockNumber: {},
  popupList: [],
  openModal: null,
  subgraphStatus: {
    available: null,
    syncedBlock: undefined,
    headBlock: undefined,
  },
}

export default createReducer(initialState, (builder) =>
  builder
    .addCase(updateChainId, (state, action) => {
      const { chainId } = action.payload
      state.chainId = chainId
    })
    .addCase(updateBlockNumber, (state, action) => {
      const { chainId, blockNumber } = action.payload
      if (typeof state.blockNumber[chainId] !== 'number') {
        state.blockNumber[chainId] = blockNumber
      } else {
        state.blockNumber[chainId] = Math.max(blockNumber, state.blockNumber[chainId])
      }
    })
    .addCase(setOpenModal, (state, action) => {
      state.openModal = action.payload
    })
    .addCase(addPopup, (state, { payload: { content, key, removeAfterMs = 25000 } }) => {
      state.popupList = (key ? state.popupList.filter((popup) => popup.key !== key) : state.popupList).concat([
        {
          key: key || nanoid(),
          show: true,
          content,
          removeAfterMs,
        },
      ])
    })
    .addCase(removePopup, (state, { payload: { key } }) => {
      state.popupList.forEach((p) => {
        if (p.key === key) {
          p.show = false
        }
      })
    })
    .addCase(updateSubgraphStatus, (state, { payload: { available, syncedBlock, headBlock } }) => {
      state.subgraphStatus = {
        available,
        syncedBlock,
        headBlock,
      }
    })
)
