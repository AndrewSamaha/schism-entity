const { randomBytes, randomUUID } = require('crypto');
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
        position: [
            Math.random() * 20,
            Math.random() * 20,
        ],
        // chunk: {    // I think this is deprecated bc we can index directly on position
        //     __typename: 'Chunk',
        //     x: Math.floor(Math.random() * 20),
        //     y: Math.floor(Math.random() * 20),
        // },
        color: 'blue',
        ...args
    }
}

module.exports = {
    Query: {
        getEntityById: async (_, args, { dataSources }) => {
            const { id } = args;
            const { redis } = dataSources;
            const entity = await redis.getEntityByIdFtSearch(id);
            console.log('getEntityById resolver received: ', entity)
            return entity;
        },
        getEntitiesInChunk: async (_, args, { dataSources }) => {
            const { chunk } = args;
            chunk.__typename = 'Chunk';
            return times(5, () => makeEntity({ args, ...chunk }));
        },
        getEntitiesByOwner: async (_, args, { dataSources }) => {
            const { ownerId } = args;
            const { redis } = dataSources;
            const entities = await redis.getEntityByOwnerId(ownerId);
            return entities;
        },
        getEntitiesNearPosition: async (_, args, { dataSources }) => {
            const { position, range } = args;
            const { redis } = dataSources;
            const entities = await redis.getEntityNearPosition(position, range);
            return entities;
        },
        getAllEntities: async (_, __, { dataSources }) => {
            const { redis } = dataSources;
            const entities = await redis.getAllEntities();
            return entities;
        },
        getMyEntities: async (_, args, { dataSources, player }) => {
            if (!player?.id) return [];
            const { id } = player;
            const { redis } = dataSources;
            const entities = await redis.getEntityByOwnerId(`player.${id}`);
            return entities;
        },
        getEntitiesICanSee: async(_, __, { dataSources, player }) => {
            //console.log('getEntitiesICanSee player',player)
            if (!player?.id) return [];
            const { redis } = dataSources;
            //console.log('getEntitiesICanSee');
            const myEntities = await redis.getEntityByOwnerId(`player.${player.id}`);
            //console.log('myEntities', myEntities);
            const otherEntities = await redis.getEntitiesNearEntities({ 
                entities: myEntities,
                ignoreId: player.id
            });
            //console.log('otherEntities', otherEntities)
            const uniqueEntities = otherEntities.reduce((uniqueData, entity) => {
                const { entities, entityIds } = uniqueData;
                if (entities.includes(entity.id)) return uniqueData;
                entities.push(entity);
                entityIds.push(entity.id);
                return { entities, entityIds};
            }, {
                entities: myEntities,
                entityIds: myEntities.map(entity => entity.id)
            })
            //console.log('uniqueEntities', uniqueEntities.entities)
            return uniqueEntities.entities;
        }
    },
    Mutation: {
        updateEntity: async (_, args, { dataSources }) => {
            const { redis } = dataSources;
            const { entity } = args;
            console.log('updateEntity received', entity);
            const result = await redis.updateEntityJson(entity);
            console.log('updateEntity', result);
            return true;
        },
        insertEntity: async (_, args, { dataSources }) => {
            const { redis } = dataSources;
            const { entity } = args;
            console.log('insertEntity received', entity);
            const result = await redis.insertEntityJson(entity);
            console.log('insertEntity', result);
            return true;
        },
        upsertEntities: async (_, args, { dataSources }) => {
            const { redis } = dataSources;
            const { entities } = args;
            return await redis.upsertEntities(entities);
        },
        upsertMyEntities: async (_, args, { dataSources, player }) => {
            if (!player?.id) return false;
            const { redis } = dataSources;
            const { entities } = args;
            const myEntities = entities.filter((entity) => entity.ownerId === `player.${player.id}`)
            return await redis.upsertEntities(myEntities);
        },
        myCreateNewEntities: async (_, args, { dataSources, player }) => {
            if (!player?.id) return false;
            const { id } = player;
            const { redis } = dataSources;
            const { entities } = args;
            const myEntities = entities.map((entity) => ({
                ...entity,
                ownerId: `player.${id}`,
                id: randomUUID()
            }));
            // console.log('sending these enties to upsert: ', myEntities)
            return await redis.upsertEntities(myEntities);
        },
        myActionEffect: async (_, args, { dataSources, player }) => {
            console.log('myActionEffect', args)
        }
    }
}