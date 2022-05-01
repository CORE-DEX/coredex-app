import ToggleBorder from 'assets/images/toggle_border.png'
import ToggleSelected from 'assets/images/toggle_selected.png'
import React from 'react'
import styled from 'styled-components'
import { FONT } from 'theme'

const ToggleElement = styled.span<{ isActive?: boolean; isOnSwitch?: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 14px;
  background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.primary1 : theme.text4) : 'none')};
  color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text3)};
  font-size: 1rem;
  font-weight: 400;

  padding: 0.35rem 0.6rem;
  background: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.primary1 : theme.text4) : 'none')};
  color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text2)};
  font-size: 1rem;
  font-weight: ${({ isOnSwitch }) => (isOnSwitch ? '500' : '400')};
  :hover {
    user-select: ${({ isOnSwitch }) => (isOnSwitch ? 'none' : 'initial')};
    background: ${({ theme, isActive, isOnSwitch }) =>
      isActive ? (isOnSwitch ? theme.primary1 : theme.text3) : 'none'};
    color: ${({ theme, isActive, isOnSwitch }) => (isActive ? (isOnSwitch ? theme.white : theme.text2) : theme.text3)};
  }
`

const StyledToggle = styled.button<{ isActive?: boolean; activeElement?: boolean }>`
  border-radius: 12px;
  border: none;
  background: ${({ theme }) => theme.bg3};
  display: flex;
  width: fit-content;
  cursor: pointer;
  outline: none;
  padding: 0;
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
}

export default function Toggle({ id, isActive, toggle }: ToggleProps) {
  return (
    <StyledToggle id={id} isActive={isActive} onClick={toggle}>
      <ToggleElement isActive={isActive} isOnSwitch={true}>
        On
      </ToggleElement>
      <ToggleElement isActive={!isActive} isOnSwitch={false}>
        Off
      </ToggleElement>
    </StyledToggle>
  )
}

export const ToggleWrapper = styled.button<{
  width?: string
  marginBottom?: string
}>`
  display: flex;
  align-items: center;
  width: ${({ width }) => width ?? '100%'};
  padding: 0;
  margin-bottom: ${({ marginBottom }) => marginBottom ?? '0'};
  background: rgba(0, 0, 0, 0);
  border: 6px solid;
  border-image-source: ${`url(${ToggleBorder})`};
  border-image-slice: 34%;
  border-image-repeat: repeat;
  cursor: pointer;
  outline: none;
  color: ${({ theme }) => theme.text2};
`

export const ToggleElementFree = styled.span<{
  isActive?: boolean
  fontSize?: string
  borderRadius?: string
  borderColor?: string
}>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 2px 10px;
  border-radius: ${({ borderRadius }) => borderRadius ?? '0'};
  justify-content: center;
  height: 100%;
  background: ${({ isActive }) => (isActive ? `url(${ToggleSelected}) center no-repeat` : 'none')};
  background-size: auto 100%;
  color: ${({ theme, isActive }) => (isActive ? theme.text1 : theme.text2)};
  text-shadow: 1px 1px 3px black;
  font-size: ${({ fontSize }) => fontSize ?? '1rem'};
  font-family: ${FONT};
  font-weight: 600;
  white-space: nowrap;
  :hover {
    user-select: initial;
    color: ${({ theme, isActive }) => (isActive ? theme.text2 : theme.text3)};
  }
  margin-top: 0.5px;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 10px;
  `};
`
