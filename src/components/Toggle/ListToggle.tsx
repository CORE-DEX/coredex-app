import React from 'react'
import styled from 'styled-components/macro'

import { FONT, TYPE } from '../../theme'

const Wrapper = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  border: none;
  background: ${({ theme }) => theme.bg1};
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0.2rem 0.2rem;
  align-items: center;
`

const ToggleElement = styled.span<{ isActive?: boolean; bgColor?: string }>`
  height: 25px;
  width: 25px;
  background-color: ${({ isActive, bgColor, theme }) => (isActive ? bgColor : theme.bg4)};
  :hover {
    opacity: 0.8;
  }
`

const StatusText = styled(TYPE.main)<{ isActive?: boolean }>`
  margin: 0 10px;
  width: 24px;
  color: ${({ theme, isActive }) => (isActive ? theme.text1 : theme.text3)};
  font-family: ${FONT};
`

interface ToggleProps {
  id?: string
  isActive: boolean
  bgColor: string
  toggle: () => void
}

export default function ListToggle({ id, isActive, bgColor, toggle }: ToggleProps) {
  return (
    <Wrapper id={id} isActive={isActive} onClick={toggle}>
      {isActive && (
        <StatusText fontWeight="600" margin="0 6px" isActive={true}>
          ON
        </StatusText>
      )}
      <ToggleElement isActive={isActive} bgColor={bgColor} />
      {!isActive && (
        <StatusText fontWeight="600" margin="0 6px" isActive={false}>
          OFF
        </StatusText>
      )}
    </Wrapper>
  )
}
