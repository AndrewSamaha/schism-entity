require('dotenv').config();
const { ApolloServer } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');

const { createContext } = require('./src/helpers/context');
const { typeDefs, resolvers } = require('./src/graph/index');
// db objects
const { returnRedisConnection } = require('./src/db/redis/redis');

const redisConnection = returnRedisConnection();

// datasources
const EntityStateDS = require('./src/datasources/EntityStateDS');
const entityStateDS = new EntityStateDS(redisConnection);

const PlayerStateDS = require('./src/datasources/PlayerStateDS');
const playerStateDS = new PlayerStateDS(redisConnection);

const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    context: createContext,
    dataSources: () => {
        return {
            entityStateDS,
            playerStateDS
        }
    },
});

server.listen({
    port: process.env.PORT
}).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
