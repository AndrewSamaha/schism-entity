const { randomBytes } = require('crypto');
const times = require('lodash/times');
/*
id: ID
    name: String
    longName: String
    speed: Float
    owner: String
    position: Position
    chunk: Chunk
    color: String
*/
const makeEntity = (args) => {
    return {
        id: randomBytes(8).toString('hex'),
        longName: 'longName'+ randomBytes(8).toString('hex'),
        speed: Math.random() * 3,
        owner: 'player' + randomBytes(4).toString('hex'),
        position: {
            __typename: 'Position',
            x: Math.random() * 20,
            y: Math.random() * 20,
            z: 0,
        },
        chunk: {
            __typename: 'Chunk',
            x: Math.floor(Math.random() * 20),
            y: Math.floor(Math.random() * 20),
        },
        color: 'blue',
        ...args
    }
}

module.exports = {
    Query: {
        getEntityById: async (_, args, { dataSources }) => {
            const { id } = args;
            const { redis } = dataSources;
            return redis.getEntityById(id);
        },
        getEntitiesInChunk: async (_, args, { dataSources }) => {
            const { chunk } = args;
            chunk.__typename = 'Chunk';
            return times(5, () => makeEntity({ args, ...chunk }));
        },
        getEntitiesByOwner: async (_, args, { dataSources }) => {
            const { ownerId } = args;
            return times(5, () => makeEntity({ args, ownerId }));
        }
    },
    Mutation: {
        updateEntity: async (_, args, { dataSources }) => {
            const { redis } = dataSources;
            const { entity } = args;
            const { id } = entity;
            console.log('updateEntity received', entity);
            const result = await redis.setEntity(entity);
            console.log('updateEntity', result);
            return true;
        }
    }
}