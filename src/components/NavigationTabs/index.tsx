import { Percent } from '@cocore/swap-sdk'
import React, { ReactNode } from 'react'
import { Box } from 'rebass'
//import { resetMintState } from 'state/mint/actions'
import styled from 'styled-components/macro'

import { TYPE } from '../../theme'
import { RowBetween } from '../Row'
//import SettingsTab from '../Settings'

const Tabs = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  justify-content: space-evenly;
`

export function FindPoolTabs({ origin, children }: { origin: string; children?: ReactNode | undefined }) {
  return (
    <Tabs>
      <RowBetween>
        <TYPE.mediumHeader
          fontWeight={500}
          fontSize={20}
          style={{ flex: '1', margin: 'auto', textAlign: children ? 'start' : 'center' }}
        >
          Import Pool
        </TYPE.mediumHeader>
      </RowBetween>
    </Tabs>
  )
}

export function AddRemoveTabs({
  adding,
  creating,
  defaultSlippage,
  positionID,
  children,
}: {
  adding: boolean
  creating: boolean
  defaultSlippage: Percent
  positionID?: string | undefined
  showBackLink?: boolean
  children?: ReactNode | undefined
}) {
  return (
    <Tabs>
      <RowBetween>
        <TYPE.mediumHeader
          fontWeight={500}
          fontSize={20}
          style={{ flex: '1', margin: 'auto', textAlign: children ? 'start' : 'center' }}
        >
          {creating ? 'Create a pair' : adding ? 'Add Liquidity' : 'Remove Liquidity'}
        </TYPE.mediumHeader>
        <Box style={{ marginRight: '.5rem' }}>{children}</Box>
      </RowBetween>
    </Tabs>
  )
}
