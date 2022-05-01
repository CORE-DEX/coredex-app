import { TokenInfo, TokenList } from '@uniswap/token-lists'
import { UNSUPPORTED_LIST_URLS } from 'constants/lists'
import BROKEN_LIST from 'constants/tokenLists/broken.tokenlist.json'
import UNSUPPORTED_TOKEN_LIST from 'constants/tokenLists/unsupported.tokenlist.json'
import { useMemo } from 'react'
import sortByListPriority from 'utils/listSort'

import { useAppSelector } from '../hooks'
import { AppState } from '../index'
import { WrappedTokenInfo } from './wrappedTokenInfo'

type TokenMap = Readonly<{ [tokenAddress: string]: { token: WrappedTokenInfo; list?: TokenList } }>
export type ChainTokenMap = Readonly<{ [chainId: number]: TokenMap }>

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

const mapCache = typeof WeakMap !== 'undefined' ? new WeakMap<TokenList | TokenInfo[], ChainTokenMap>() : null

export function tokensToChainTokenMap(tokens: TokenList | TokenInfo[]): ChainTokenMap {
  const cached = mapCache?.get(tokens)
  if (cached) return cached

  const [list, infos] = Array.isArray(tokens) ? [undefined, tokens] : [tokens, tokens.tokens]
  const map = infos.reduce<Mutable<ChainTokenMap>>((map, info) => {
    const token = new WrappedTokenInfo(info, list)
    if (map[token.chainId]?.[token.address] !== undefined) {
      console.warn(`Duplicate token skipped: ${token.address}`)
      return map
    }
    if (!map[token.chainId]) {
      map[token.chainId] = {}
    }
    map[token.chainId][token.address] = { token, list }
    return map
  }, {}) as ChainTokenMap
  mapCache?.set(tokens, map)
  return map
}

export function useAllLists(): AppState['lists']['byUrl'] {
  return useAppSelector((state) => state.lists.byUrl)
}

/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additioanl tokens to add to the base map
 */
export function combineMaps(map1: ChainTokenMap, map2: ChainTokenMap): ChainTokenMap {
  const chainIds = Object.keys(
    Object.keys(map1)
      .concat(Object.keys(map2))
      .reduce<{ [chainId: string]: true }>((memo, value) => {
        memo[value] = true
        return memo
      }, {})
  ).map((id) => parseInt(id))

  return chainIds.reduce<Mutable<ChainTokenMap>>((memo, chainId) => {
    memo[chainId] = {
      ...map2[chainId],
      // map1 takes precedence
      ...map1[chainId],
    }
    return memo
  }, {}) as ChainTokenMap
}

// merge tokens contained within lists from urls
function useCombinedTokenMapFromUrls(urls: string[] | undefined): ChainTokenMap {
  const lists = useAllLists()
  return useMemo(() => {
    if (!urls) return {}
    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .sort(sortByListPriority)
        .reduce((allTokens, currentUrl) => {
          const current = lists[currentUrl]?.current
          if (!current) return allTokens
          try {
            return combineMaps(allTokens, tokensToChainTokenMap(current))
          } catch (error) {
            console.error('Could not show token list due to error', error)
            return allTokens
          }
        }, {})
    )
  }, [lists, urls])
}

// filter out unsupported lists
export function useActiveListUrls(): string[] | undefined {
  return useAppSelector((state) => state.lists.activeListUrls)?.filter((url) => !UNSUPPORTED_LIST_URLS.includes(url))
}

export function useInactiveListUrls(): string[] {
  const lists = useAllLists()
  const allActiveListUrls = useActiveListUrls()
  return Object.keys(lists).filter((url) => !allActiveListUrls?.includes(url) && !UNSUPPORTED_LIST_URLS.includes(url))
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): ChainTokenMap {
  const activeListUrls = useActiveListUrls()
  const activeTokens = useCombinedTokenMapFromUrls(activeListUrls)
  return activeTokens
}

// list of tokens not supported on interface, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(): ChainTokenMap {
  // broken tokens, blocked on all URLS
  const brokenListMap = useMemo(() => tokensToChainTokenMap(BROKEN_LIST), [])

  // get hard coded unsupported tokens, only block on app url
  const localUnsupportedListMap = useMemo(() => tokensToChainTokenMap(UNSUPPORTED_TOKEN_LIST), [])

  // get any loaded unsupported tokens, this will be empty if not on app URL
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS)

  // format into one token address map
  return useMemo(
    () => combineMaps(brokenListMap, combineMaps(localUnsupportedListMap, loadedUnsupportedListMap)),
    [localUnsupportedListMap, loadedUnsupportedListMap, brokenListMap]
  )
}

export function useIsListActive(url: string): boolean {
  const activeListUrls = useActiveListUrls()
  return Boolean(activeListUrls?.includes(url))
}
