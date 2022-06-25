import { FACTORY_ADDRESS } from '@core-dex/sdk'
import { constructSameAddressMap } from 'utils/constructSameAddressMap'

import { SupportedChainId } from './chains'

type AddressMap = { [chainId: number]: string }

export const MULTICALL_NETWORKS: AddressMap = {
  [SupportedChainId.MAINNET]: '0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441',
  [SupportedChainId.GOERLI]: '0x77dca2c955b15e9de4dbbcf1246b4b85b651e50e',
  [SupportedChainId.POLYGON]: '0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507',
  [SupportedChainId.MUMBAI]: '0x08411ADd0b5AA8ee47563b146743C13b3556c9Cc',
}

export const FACTORY_ADDRESSES: AddressMap = constructSameAddressMap(FACTORY_ADDRESS, [
  SupportedChainId.MUMBAI,
  SupportedChainId.POLYGON,
])
export const ROUTER_ADDRESS: AddressMap = constructSameAddressMap('0x3584B983Ac30FBdf9Fe21795BBff5e94F66f64C7', [
  SupportedChainId.POLYGON,
  SupportedChainId.MUMBAI,
])

export const ARGENT_WALLET_DETECTOR_ADDRESS: AddressMap = {
  [SupportedChainId.MAINNET]: '0xeca4B0bDBf7c55E9b7925919d03CbF8Dc82537E8',
}

export const ENS_REGISTRAR_ADDRESSES: AddressMap = {
  [SupportedChainId.MAINNET]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [SupportedChainId.GOERLI]: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
}

export const POOL_HIDE: string[] = []
export const TOKEN_HIDE: string[] = []

export const ETH_USDC_ADDRESS = '0xc48133ee1acd520647f9f4f47de8eab69b0c5620'

// hide from overview list
export const TOKEN_BLACKLIST = [
  '0x495c7f3a713870f68f8b418b355c085dfdc412c3',
  '0xc3761eb917cd790b30dad99f6cc5b4ff93c4f9ea',
  '0xe31debd7abff90b06bca21010dd860d8701fd901',
  '0xfc989fbb6b3024de5ca0144dc23c18a063942ac1',
  '0xf4eda77f0b455a12f3eb44f8653835f377e36b76',
  '0x93b2fff814fcaeffb01406e80b4ecd89ca6a021b',

  // rebass tokens
  '0x9ea3b5b4ec044b70375236a281986106457b20ef',
  '0x05934eba98486693aaec2d00b0e9ce918e37dc3f',
  '0x3d7e683fc9c86b4d653c9e47ca12517440fad14e',
  '0xfae9c647ad7d89e738aba720acf09af93dc535f7',
  '0x7296368fe9bcb25d3ecc19af13655b907818cc09',
]

// pair blacklist
export const PAIR_BLACKLIST = [
  '0xb6a741f37d6e455ebcc9f17e2c16d0586c3f57a5',
  '0x97cb8cbe91227ba87fc21aaf52c4212d245da3f8',
  '0x1acba73121d5f63d8ea40bdc64edb594bd88ed09',
  '0x7d7e813082ef6c143277c71786e5be626ec77b20',
]

// warnings to display if page contains info about blocked token
export const BLOCKED_WARNINGS = {
  '0xf4eda77f0b455a12f3eb44f8653835f377e36b76':
    'TikTok Inc. has asserted this token is violating its trademarks and therefore is not available.',
}

/**
 * For tokens that cause erros on fee calculations
 */
export const FEE_WARNING_TOKENS = ['0xd46ba6d942050d489dbd938a2c909a5d5039a161']

export const UNTRACKED_COPY = 'Derived USD values may be inaccurate without liquid stablecoin or ETH pairings.'

// tokens that should be tracked but arent due to lag in subgraph
export const TRACKED_OVERRIDES = [
  '0x9928e4046d7c6513326ccea028cd3e7a91c7590a',
  '0x87da823b6fc8eb8575a235a824690fda94674c88',
  '0xcd7989894bc033581532d2cd88da5db0a4b12859',
  '0xe1573b9d29e2183b1af0e743dc2754979a40d237',
  '0x45804880de22913dafe09f4980848ece6ecbaf78',
  '0x709f7b10f22eb62b05913b59b92ddd372d4e2152',
]
