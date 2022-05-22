import { CHAIN_INFO } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useActiveWeb3React } from 'hooks/web3'
import React from 'react'
import styled from 'styled-components/macro'

import { ExternalLink } from '../../theme'

const L2Icon = styled.img`
  width: 20px;
  height: 20px;
  margin-left: 8px;

  :hover,
  :focus {
    opacity: 0.7;
  }
`

export const Controls = styled.div`
  align-items: center;
  display: flex;
  justify-content: flex-start;
  padding: 0 20px 20px 20px;
`

const SHOULD_SHOW_ALERT = {
  [SupportedChainId.POLYGON]: true,
  [SupportedChainId.MUMBAI]: true,
}

type NetworkAlertChains = keyof typeof SHOULD_SHOW_ALERT

const LinkOutToBridge = styled(ExternalLink)`
  align-items: center;
  color: white;
  display: flex;
  font-size: 16px;
  justify-content: space-between;
  padding: 6px 8px;
  margin-right: 12px;
  text-decoration: none !important;
`

function shouldShowAlert(chainId: number | undefined): chainId is NetworkAlertChains {
  return Boolean(chainId && SHOULD_SHOW_ALERT[chainId as unknown as NetworkAlertChains])
}

export function NetworkAlert() {
  const { chainId } = useActiveWeb3React()

  if (!shouldShowAlert(chainId)) {
    return null
  }

  const { logoUrl, bridge } = CHAIN_INFO[chainId]

  return bridge ? (
    <LinkOutToBridge href={bridge}>
      <L2Icon src={logoUrl} />
    </LinkOutToBridge>
  ) : null
}
