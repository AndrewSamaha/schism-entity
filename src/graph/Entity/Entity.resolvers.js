const { ForbiddenError } = require('apollo-server');
const { randomBytes, randomUUID } = require('crypto');
const times = require('lodash/times');
const set = require('lodash/set');
const last = require('lodash/last');
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

const ownerIdString = (id) => `player.${id}`;

module.exports = {
    Query: {
        getEntityById: async (_, args, { dataSources }) => {
            const { id } = args;
            const { entityStateDS } = dataSources;
            const entity = await entityStateDS.getEntityByIdFtSearch(id);
            return entity;
        },
        getEntitiesInChunk: async (_, args, { dataSources }) => {
            const { chunk } = args;
            chunk.__typename = 'Chunk';
            return times(5, () => makeEntity({ args, ...chunk }));
        },
        getEntitiesByOwner: async (_, args, { dataSources }) => {
            const { ownerId } = args;
            const { entityStateDS } = dataSources;
            const entities = await entityStateDS.getEntityByOwnerId(ownerId);
            return entities;
        },
        getEntitiesNearPosition: async (_, args, { dataSources }) => {
            const { position, range } = args;
            const { entityStateDS } = dataSources;
            const entities = await entityStateDS.getEntityNearPosition(position, range);
            return entities;
        },
        getAllEntities: async (_, __, { dataSources }) => {
            const { entityStateDS } = dataSources;
            const entities = await entityStateDS.getAllEntities();
            return entities;
        },
        getMyEntities: async (_, args, { dataSources, player }) => {
            if (!player?.id) return [];
            const { id } = player;
            const { entityStateDS } = dataSources;
            const entities = await entityStateDS.getEntityByOwnerId(`player.${id}`);
            return entities;
        },
        getEntitiesICanSee: async(_, __, { dataSources, player }) => {
            if (!player?.id) return [];
            const { entityStateDS } = dataSources;
            const myEntities = await entityStateDS.getEntityByOwnerId(`player.${player.id}`);
            const otherEntities = await entityStateDS.getEntitiesNearEntities({ 
                entities: myEntities,
                ignoreId: player.id
            });
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
            return uniqueEntities.entities;
        }
    },
    Mutation: {
        updateEntity: async (_, args, { dataSources }) => {
            const { entityStateDS } = dataSources;
            const { entity } = args;
            const result = await entityStateDS.updateEntityJson(entity);
            return true;
        },
        insertEntity: async (_, args, { dataSources }) => {
            const { entityStateDS } = dataSources;
            const { entity } = args;
            const result = await entityStateDS.insertEntityJson(entity);
            return true;
        },
        upsertEntities: async (_, args, { dataSources }) => {
            const { entityStateDS } = dataSources;
            const { entities } = args;
            return await entityStateDS.upsertEntities(entities);
        },
        upsertMyEntities: async (_, args, { dataSources, player }) => {
            if (!player?.id) return false;
            const { entityStateDS } = dataSources;
            const { entities } = args;
            const myEntities = entities.filter((entity) => entity.ownerId === `player.${player.id}`)
            return await entityStateDS.upsertEntities(myEntities);
        },
        myCreateNewEntities: async (_, args, { dataSources, player }) => {
            if (!player?.id) return false;
            const { id } = player;
            const { entityStateDS } = dataSources;
            const { entities } = args;
            const myEntities = entities.map((entity) => ({
                ...entity,
                ownerId: `player.${id}`,
                id: randomUUID()
            }));
            return await entityStateDS.upsertEntities(myEntities);
        },
        myActionEffect: async (_, args, { dataSources, player }) => {
            if (!player?.id) return false;
            const { entityStateDS } = dataSources;
            const { aE } = args;
            const { 
                sourceEntityId,
                targetEntityId,
                targetEntityJSON,
                sourceEntityJSON
            } = aE;
            
            const sourceEntity = JSON.parse(sourceEntityJSON);
            const targetEntity = JSON.parse(targetEntityJSON);            
            const playerId = ownerIdString(player.id);

            if (playerId !== sourceEntity.ownerId && playerId !== targetEntity.ownerId) {
                throw new ForbiddenError(`Request to mutate unrelated entity ${targetEntityId} by ${playerId}.`)
            }
            
            const entityArray = await entityStateDS.getEntityByIdFtSearch(targetEntityId);

            let entity = last(entityArray);
        
            aE.changeLog[0].changes.forEach((change) => {
                if (change.path === 'tic') return;
                set(entity, change.path, parseFloat(change.value))
            })
            
            await entityStateDS.updateEntity(entity);
        
            return true;
        }
    }
}