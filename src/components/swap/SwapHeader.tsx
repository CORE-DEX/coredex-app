import { Percent } from '@core-dex/sdk'
import ToggleBorder from 'assets/images/toggle_border.png'
import React from 'react'
import styled from 'styled-components/macro'

import { TYPE } from '../../theme'
import { RowBetween, RowFixed } from '../Row'
import SettingsTab from '../Settings'

const StyledSwapHeader = styled.div`
  padding: 0 1.25rem 1rem 1.25rem;
  width: 100%;
  color: ${({ theme }) => theme.text2};
`

const SwapNameWrapper = styled.div<{
  marginBottom?: string
}>`
  width: '100%';
  padding: 0;
  margin-bottom: ${({ marginBottom }) => marginBottom ?? '0'};
  background: rgba(0, 0, 0, 0);
  border: 6px solid;
  border-image-source: ${`url(${ToggleBorder})`};
  border-image-slice: 34%;
  border-image-repeat: repeat;
`

export default function SwapHeader({ allowedSlippage }: { allowedSlippage: Percent }) {
  return (
    <StyledSwapHeader>
      <RowBetween>
        <RowFixed>
          <TYPE.black fontWeight={500} fontSize={16} style={{ marginRight: '8px' }}>
            Swap
          </TYPE.black>
        </RowFixed>
        <RowFixed>
          <SettingsTab placeholderSlippage={allowedSlippage} />
        </RowFixed>
      </RowBetween>
    </StyledSwapHeader>
  )
}

export function SwapNameCard({ marginBottom }: { marginBottom?: string }) {
  return (
    <SwapNameWrapper marginBottom={marginBottom}>
      <TYPE.black fontWeight={600} fontSize={16} style={{ padding: '2.25px 10px', textAlign: 'center' }}>
        Swap
      </TYPE.black>
    </SwapNameWrapper>
  )
}
