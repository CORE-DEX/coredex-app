import BackCard from 'assets/images/card_backCard.png'
import { Box } from 'rebass/styled-components'
import styled from 'styled-components/macro'

const Card = styled(Box)<{
  width?: string
  padding?: string
  border?: string
  $borderRadius?: string
  backCard?: boolean
}>`
  width: ${({ width }) => width ?? '100%'};
  padding: ${({ padding }) => padding ?? '1rem'};
  border-radius: ${({ $borderRadius }) => $borderRadius ?? '0px'};
  border: ${({ border, theme }) => (border ? border : `2px solid ${theme.border1}`)};
  background-image: ${({ backCard }) => (backCard ? '' : `url(${BackCard})`)};
`
export default Card

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg2};
  background-color: ${({ theme }) => theme.bg1};
`

export const LightGreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg3};
`

export const GreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg2};
`

export const DarkGreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.bg0};
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.bg3};
`

export const YellowCard = styled(Card)`
  background-color: rgba(243, 132, 30, 0.05);
  color: ${({ theme }) => theme.yellow3};
  font-weight: 500;
`

export const BlueCard = styled(Card)`
  background-color: ${({ theme }) => theme.primary5};
  color: ${({ theme }) => theme.blue2};
`
