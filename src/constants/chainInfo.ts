import ethereumLogoUrl from 'assets/images/ethereum-logo.png'
import polygonMaticLogo from 'assets/svg/polygon-matic-logo.svg'
import ms from 'ms.macro'

import { SupportedChainId, SupportedL1ChainId } from './chains'

const ALCHEMY_ETH_KEY = process.env.REACT_APP_ALCHEMY_ETH_KEY
const ALCHEMY_ROPSTEN_KEY = process.env.REACT_APP_ALCHEMY_ROPSTEN_KEY
const ALCHEMY_POLYGON_KEY = process.env.REACT_APP_ALCHEMY_POLYGON_KEY
const ALCHEMY_MUMBAI_KEY = process.env.REACT_APP_ALCHEMY_MUMBAI_KEY
if (typeof ALCHEMY_ETH_KEY === 'undefined') {
  throw new Error(`REACT_APP_ALCHEMY_ETH_KEY must be a defined environment variable`)
}
if (typeof ALCHEMY_ROPSTEN_KEY === 'undefined') {
  throw new Error(`REACT_APP_ALCHEMY_ROPSTEN_KEY must be a defined environment variable`)
}
if (typeof ALCHEMY_POLYGON_KEY === 'undefined') {
  throw new Error(`REACT_APP_ALCHEMY_POLYGON_KEY must be a defined environment variable`)
}
if (typeof ALCHEMY_MUMBAI_KEY === 'undefined') {
  throw new Error(`REACT_APP_ALCHEMY_MUMBAI_KEY must be a defined environment variable`)
}

/**
 * These are the network URLs used by the interface when there is not another available source of chain data
 */
export const ALCHEMY_NETWORK_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_ETH_KEY}`,
  [SupportedChainId.ROPSTEN]: `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_ROPSTEN_KEY}`,
  [SupportedChainId.POLYGON]: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_POLYGON_KEY}`,
  [SupportedChainId.MUMBAI]: `https://polygon-mumbai.g.alchemy.com/v2/${ALCHEMY_MUMBAI_KEY}`,
}

/**
 * This is used to call the add network RPC
 */
interface AddNetworkInfo {
  readonly rpcUrl: string
  readonly nativeCurrency: {
    name: string // e.g. 'Ropsten ETH',
    symbol: string // e.g. 'ropETH',
    decimals: number // e.g. 18,
  }
}

export enum NetworkType {
  L1,
  L2,
}

interface BaseChainInfo {
  readonly networkType: NetworkType
  readonly blockWaitMsBeforeWarning?: number
  readonly docs: string
  readonly bridge?: string
  readonly explorer: string
  readonly infoLink: string
  readonly logoUrl: string
  readonly label: string
  readonly helpCenterUrl?: string
  readonly addNetworkInfo: AddNetworkInfo
  readonly bgColor: string
  readonly primaryColor: string
  readonly scrollColor: string
  readonly toggleColor: string
}

export interface L1ChainInfo extends BaseChainInfo {
  readonly networkType: NetworkType.L1
}

export type ChainInfoMap = { readonly [chainId: number]: L1ChainInfo } & {
  readonly [chainId in SupportedL1ChainId]: L1ChainInfo
}

export const CHAIN_INFO: ChainInfoMap = {
  [SupportedChainId.MAINNET]: {
    networkType: NetworkType.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ethereum',
    logoUrl: ethereumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrl: ALCHEMY_NETWORK_URLS[SupportedChainId.MAINNET],
    },
    bgColor: '#00CC22',
    primaryColor: '#00CC22',
    scrollColor: '#00cc227a',
    toggleColor: '#00cc2214',
  },
  [SupportedChainId.ROPSTEN]: {
    networkType: NetworkType.L1,
    docs: 'https://docs.uniswap.org/',
    explorer: 'https://ropsten.etherscan.io/',
    infoLink: 'https://info.uniswap.org/#/',
    label: 'Ropsten',
    logoUrl: ethereumLogoUrl,
    addNetworkInfo: {
      nativeCurrency: { name: 'Ropsten Ether', symbol: 'ropETH', decimals: 18 },
      rpcUrl: ALCHEMY_NETWORK_URLS[SupportedChainId.ROPSTEN],
    },
    bgColor: '#00CC22',
    primaryColor: '#00CC22',
    scrollColor: '#00cc227a',
    toggleColor: '#00cc2214',
  },
  [SupportedChainId.POLYGON]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon',
    logoUrl: polygonMaticLogo,
    addNetworkInfo: {
      rpcUrl: 'https://polygon-rpc.com/',
      nativeCurrency: { name: 'Polygon Matic', symbol: 'MATIC', decimals: 18 },
    },
    bgColor: '#8247e5',
    primaryColor: '#8247e5',
    scrollColor: '#8247e57a',
    toggleColor: '#8247e514',
  },
  [SupportedChainId.MUMBAI]: {
    networkType: NetworkType.L1,
    blockWaitMsBeforeWarning: ms`10m`,
    bridge: 'https://wallet.polygon.technology/bridge',
    docs: 'https://polygon.io/',
    explorer: 'https://mumbai.polygonscan.com/',
    infoLink: 'https://info.uniswap.org/#/polygon/',
    label: 'Polygon Mumbai',
    logoUrl: polygonMaticLogo,
    addNetworkInfo: {
      nativeCurrency: { name: 'Polygon Mumbai Matic', symbol: 'mMATIC', decimals: 18 },
      rpcUrl: 'https://rpc-endpoints.superfluid.dev/mumbai',
    },
    bgColor: '#8247e5',
    primaryColor: '#8247e5',
    scrollColor: '#8247e57a',
    toggleColor: '#8247e514',
  },
}
