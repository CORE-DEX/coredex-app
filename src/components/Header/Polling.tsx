import { CHAIN_INFO } from 'constants/chainInfo'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import useMachineTimeMs from 'hooks/useMachineTime'
import { useActiveWeb3React } from 'hooks/web3'
import ms from 'ms.macro'
import React, { useEffect, useState } from 'react'
import { useBlockNumber } from 'state/application/hooks'
import styled, { keyframes } from 'styled-components/macro'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

import { ExternalLink, TYPE } from '../../theme'
import { ChainConnectivityWarning } from './ChainConnectivityWarning'

const StyledPolling = styled.div`
  position: fixed;
  display: flex;
  align-items: center;
  right: 0;
  bottom: 0;
  padding: 1rem;
  color: ${({ theme }) => theme.green1};

  @media (max-width: 1080px) {
    display: none;
  }

  @media (max-height: 950px) {
    display: none;
  }
`
const StyledPollingNumber = styled(TYPE.small)<{ breathe: boolean; hovering: boolean }>`
  transition: opacity 0.25s ease;
  opacity: ${({ breathe, hovering }) => (hovering ? 0.7 : breathe ? 1 : 0.5)};
  :hover {
    opacity: 1;
  }
`
const StyledPollingDot = styled.div`
  width: 8px;
  height: 8px;
  min-height: 8px;
  min-width: 8px;
  margin-left: 0.5rem;
  border-radius: 50%;
  position: relative;
  background-color: ${({ theme }) => theme.green1};
`

const rotate360 = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Spinner = styled.div`
  animation: ${rotate360} 1s cubic-bezier(0.83, 0, 0.17, 1) infinite;
  transform: translateZ(0);

  border-top: 1px solid transparent;
  border-right: 1px solid transparent;
  border-bottom: 1px solid transparent;
  border-left: 2px solid ${({ theme }) => theme.green1};
  background: transparent;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  position: relative;

  left: -3px;
  top: -3px;
`

const DEFAULT_MS_BEFORE_WARNING = ms`10m`
const NETWORK_HEALTH_CHECK_MS = ms`10s`

export default function Polling() {
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const machineTime = useMachineTimeMs(NETWORK_HEALTH_CHECK_MS)
  const blockTime = useCurrentBlockTimestamp()

  const [isMounting, setIsMounting] = useState(false)
  const [isHover, setIsHover] = useState(false)

  const waitMsBeforeWarning =
    (chainId ? CHAIN_INFO[chainId]?.blockWaitMsBeforeWarning : DEFAULT_MS_BEFORE_WARNING) ?? DEFAULT_MS_BEFORE_WARNING

  const warning = Boolean(!!blockTime && machineTime - blockTime.mul(1000).toNumber() > waitMsBeforeWarning)

  useEffect(
    () => {
      if (!blockNumber) {
        return
      }

      setIsMounting(true)
      const mountingTimer = setTimeout(() => setIsMounting(false), 1000)

      // this will clear Timeout when component unmount like in willComponentUnmount
      return () => {
        clearTimeout(mountingTimer)
      }
    },
    [blockNumber] //useEffect will run only one time
    //if you pass a value to array, like this [data] than clearTimeout will run every time this value changes (useEffect re-run)
  )

  return (
    <ExternalLink
      href={chainId && blockNumber ? getExplorerLink(chainId, blockNumber.toString(), ExplorerDataType.BLOCK) : ''}
    >
      <StyledPolling onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)}>
        <StyledPollingNumber breathe={isMounting} hovering={isHover}>
          {blockNumber}
        </StyledPollingNumber>
        <StyledPollingDot>{isMounting && <Spinner />}</StyledPollingDot>
      </StyledPolling>
      {warning && <ChainConnectivityWarning />}
    </ExternalLink>
  )
}
