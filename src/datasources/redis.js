const { RESTDataSource } = require("apollo-datasource-rest");
const { SchemaFieldTypes } = require("redis");
const PLAYER_JWT_SECRET_KEY = 'playerJwtSecret';

// https://github.com/redis/node-redis/tree/2a8e11a51d4f965b2d902bd8e6b041f04d984182/packages/json
// https://github.com/redis/node-redis/tree/2a8e11a51d4f965b2d902bd8e6b041f04d984182/packages/search
// Create an index
//      FT.CREATE myIdxy on JSON SCHEMA $.entities.*.position.y AS y NUMERIC $.entities.*.position.x as X NUMERIC
//      FT.CREATE myIdx on JSON SCHEMA $.entities.*.position.y AS y NUMERIC $.entities.*.position.x AS x NUMERIC
//      FT.DROPINDEX myIdx
/*
        JSON.SET noderedis:jsondata $ '{"entities":{"entityA":{"id":"entityA","name":"EntityAlpha","longName":"This is entity alpha","speed":9.66,"ownerId":"god","position":{"x":15,"y":15},"color":"red"},"entityB":{"id":"entityB","name":"EntityBeta","longName":"This is entity beta","speed":9.66,"ownerId":"god","position":{"x":20,"y":20},"color":"red"},"entityC":{"id":"entityC","name":"EntityCeta","longName":"This is entity ceta","speed":9.66,"ownerId":"god","position":{"x":15,"y":25},"color":"fire"}}}'

        FT.CREATE myIdx on JSON PREFIX 1 entity: SCHEMA $.position.y AS y NUMERIC $.position.x AS x NUMERIC $.name AS name TEXT
        JSON.SET entity:1 $ '{"id":"entityA","name":"EntityAlpha","longName":"This is entity alpha","speed":9.66,"ownerId":"god","position":{"x":15,"y":15},"color":"red"}'
        JSON.SET entity:2 $ '{"id":"entityB","name":"EntityBeta","longName":"This is entity beta","speed":9.66,"ownerId":"god","position":{"x":20,"y":20},"color":"red"}'
        JSON.SET entity:3 $ '{"id":"entityC","name":"EntityCeta","longName":"This is entity ceta","speed":9.66,"ownerId":"god","position":{"x":15,"y":25},"color":"fire"}'

        This pattern works, but who knows how slow it is compared to using indexes
        > JSON.SET myDoc $ '{"books": [{"title": "Peter Pan", "price": 8.95}, {"title": "Moby Dick", "price": 12.99}]}'
        OK
        > JSON.GET myDoc '$.books[?(@.price < 10)]'
        [{"title":"Peter Pan","price":8.95}]
        > JSON.GET myDoc '$.books[?(@.price > 10 && @.price < 20)]'
        [{"title":"Moby Dick","price":12.99}]
        > JSON.SET myDoc '$.books[?(@.price > 10 && @.price < 20)]' '{"title":"Candyland","price":30.13}'
        OK
        > JSON.GET myDoc
        {"books":[{"title":"Peter Pan","price":8.95},{"title":"Candyland","price":30.13}]}
JSON.SET myDoc $ '[{"title": "Peter Pan", "price": 8.95, "position": {"x": 10, "y": 10}}, {"title": "Moby Dick", "price": 12.99,"position": {"x": 10, "y": 20}}]'

*/

// const JSON_DOC_NAME = 'noderedis:jsondata';
const JSON_DOC_NAME = 'flatEntitiesArray';
const ENTITY_INDEX = 'entityIdx';
const JSON_DOC_PREFIX = 'entity:';

class RedisDs extends RESTDataSource {
    /// https://www.apollographql.com/docs/apollo-server/data/data-sources/
    constructor(client) {
        super();
        this.client = client;
        this.createEntityIndex();
    }

    async createEntityIndex() {
        /*
        FT.CREATE myIdx on JSON PREFIX 1 entity: SCHEMA 
        $.position.y AS y NUMERIC 
        $.position.x AS x NUMERIC
        $.name AS name TEXT  
        */
        const client = await this.client;
        let indexExists = null;
        try {
            indexExists = await client.ft.info(ENTITY_INDEX);
            console.log('createEntityIndex indexExists:',ENTITY_INDEX);
        } catch (e) {
            console.log('createEntityIndex exception', e, ENTITY_INDEX);
        }
        if (indexExists) return;
        
        try {
            const createResult = await client.ft.create(ENTITY_INDEX, {
                '$.id': {
                    type: SchemaFieldTypes.TEXT,
                    //sortable: true,
                    AS: 'id'
                },
                '$.position.x': {
                    type: SchemaFieldTypes.NUMERIC,
                    AS: 'x'
                },
                '$.position.y': {
                    type: SchemaFieldTypes.NUMERIC,
                    AS: 'y'
                },
                '$.name': {
                    type: SchemaFieldTypes.TEXT,
                    AS: 'name'
                },
                '$.ownerId': {
                    type: SchemaFieldTypes.TEXT,
                    AS: 'ownerId'
                }
            }, {
                ON: 'JSON',
                PREFIX: JSON_DOC_PREFIX  
            });
            console.log('createEntityIndex already exists');
        } catch (e) {
            console.log('createEntityIndex exception:', e)
        }
        
        
    }

    async getJWTSecret() {
        const client = await this.client;
        const secret = client.get(PLAYER_JWT_SECRET_KEY);
        return secret;
    }

    async setJwtSecret(secret){
        const client = await this.client;
        await client.set(PLAYER_JWT_SECRET_KEY, secret);
    }

    async setEntity(entity) {
        const { id } = entity;
        const client = await this.client;
        const entityString = JSON.stringify(entity);
        await client.set(id, entityString);
        return true;
    }

    async getEntityById(id) {
        const client = await this.client;
        const entityJson = await client.get(id);
        console.log('getEntityById',id, entityJson)
        if (!entityJson) return {};
        return JSON.parse(entityJson);
    }

    async updateEntityJson(entity) {
        const { id } = entity;
        const client = await this.client;

        const documentName = `entity:${id}`;
        await client.json.set(documentName, '$', entity);

        return true;
    }

    async upsertEntities(entities) {
        const client = await this.client;

        const promises = entities.reduce((accumulator, entity) => {
            const { id } = entity;
            const documentName = `entity:${id}`;
            return accumulator.json.set(documentName, '$', entity);
        }, client.multi())

        console.log('promises',promises)
        const results = await promises.exec();
        console.log('upsertEntities results=', results)

        //await client.json.set(documentName, '$', entity);

        return results.map((result) => result === 'OK');
    }


    async insertEntityJson(entity) {
        return await this.updateEntityJson(entity);
    }

    async getEntityByIdFtSearch(id) {
        const client = await this.client;
        const results = await client.ft.search(
            ENTITY_INDEX,
            `@id:${id}`
        ); 
        if (!results) return [];
        console.log('ft.search results', results)
        const { documents } = results;
        console.log('documents',documents)
        const entities = documents.map((document) => {
            const { id: documentId, value: entity } = document;
            return entity;
        });
        return entities;
    }

    async getEntityByOwnerId(ownerId) {
        const client = await this.client;
        const results = await client.ft.search(
            ENTITY_INDEX,
            `@ownerId:${ownerId}`
        ); 
        console.log('getEntityByOwnerId ownerId', ownerId, 'results', results)
        if (!results) return [];
        const { documents } = results;
        const entities = documents.map((document) => {
            const { id: documentId, value: entity } = document;
            return entity;
        });
        return entities;
    }

    async getEntityNearPosition(position, range) {
        if (!position?.x || !position?.y) 
            return [];
    
        const client = await this.client;
        const results = await client.ft.search(
            ENTITY_INDEX,
            `@x:[${position.x - range} ${position.x + range}] @y:[${position.y - range} ${position.y + range}]`
        ); 
        if (!results) return [];
        const { documents } = results;
        const entities = documents.map((document) => {
            const { id: documentId, value: entity } = document;
            return entity;
        });
        return entities;
    }

    async getEntitiesNearEntities(entities, ignoreId = null, defaultRange = 4) {
        if (!entities || !entities.length) return [];
        const promises = entities.reduce((accumulator, entity) => {
            const { position: { x, y }, sightRange } = entity;
            const range = sightRange ? sightRange : defaultRange;
            return accumulator.ft.search(ENTITY_INDEX,
                `@x:[${x - range} ${x + range}] @y:[${y - range} ${y + range}] -@ownerId:${ownerId}`)
        
        }, client.multi())
        const results = await promises.exec();
        console.log('getEntitiesNearEntities', results)
        return [];
    }

    async getAllEntities() {
        const client = await this.client;
        const results = await client.ft.search(
            ENTITY_INDEX,
            `*`
        ); 
        if (!results) return [];
        const { documents } = results;
        const entities = documents.map((document) => {
            const { id: documentId, value: entity } = document;
            return entity;
        });
        return entities;
    }

    // async getEntitiesICanSee(myId) {
    //     const myEntities = await getEntitiesByOwnerId(myId);

    //     const result = {
    //         myEntities,
    //         otherEntities: myEntities

    //     }
    //     const client = await this.client;
    //     const results = await client.ft.search(
    //         ENTITY_INDEX,
    //         `*`
    //     ); 
    //     if (!results) return [];
    //     const { documents } = results;
    //     const entities = documents.map((document) => {
    //         const { id: documentId, value: entity } = document;
    //         return entity;
    //     });
    //     return entities;
    // }
}

module.exports = RedisDs;