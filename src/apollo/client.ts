import { ApolloClient, InMemoryCache } from '@apollo/client'

export const healthClient = new ApolloClient({
  uri: 'https://api.thegraph.com/index-node/graphql',
  cache: new InMemoryCache(),
  //shouldBatch: true,
})

export const blockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks',
  cache: new InMemoryCache(),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

export const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/core-dex/core-dex-mainnet',
  cache: new InMemoryCache(),
  //shouldBatch: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

export const goerliClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/core-dex/core-dex-goerli',
  cache: new InMemoryCache(),
  //shouldBatch: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

export const goerliBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/blocklytics/goerli-blocks',
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

export const polygonClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/core-dex/core-dex-polygon',
  cache: new InMemoryCache(),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

export const polygonBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/ianlapham/polygon-blocks',
  cache: new InMemoryCache(),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
})

export const mumbaiClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/core-dex/core-dex-mumbai',
  cache: new InMemoryCache(),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
    },
    query: {
      fetchPolicy: 'no-cache',
      errorPolicy: 'all',
    },
  },
})

export const mumbaiBlockClient = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/dolomite-exchange/mumbai-blocks',
  cache: new InMemoryCache(),
  queryDeduplication: true,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
  },
})
