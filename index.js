require('dotenv').config();
const { ApolloServer } = require('apollo-server');
const { buildSubgraphSchema } = require('@apollo/subgraph');

const { createContext } = require('./src/helpers/context');
const { typeDefs, resolvers } = require('./src/graph/index');
// db objects
const { returnRedisConnection } = require('./src/db/redis/redis');

// datasources
const RedisDs = require('./src/datasources/redis');

const redis = new RedisDs(returnRedisConnection());

const server = new ApolloServer({
    schema: buildSubgraphSchema({ typeDefs, resolvers }),
    context: createContext,
    dataSources: () => {
        return {
            redis
        }
    },
});

server.listen({
    port: process.env.PORT
}).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
