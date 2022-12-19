const { RESTDataSource } = require("apollo-datasource-rest");
const { SchemaFieldTypes } = require("redis");
const { uuid } = require("uuid");
const uniqBy = require('lodash/uniqBy');

const { PLAYER_JWT_SECRET_KEY, ENTITY_INDEX, JSON_DOC_ENTITY_PREFIX, LIMITOBJ } = require('../constants/redis');

class EntityStateDS extends RESTDataSource {
    /// https://www.apollographql.com/docs/apollo-server/data/data-sources/
    constructor(client) {
        super();
        this.client = client;
        this.createEntityIndex();
    }

    async createEntityIndex() {
        /*
        FT.CREATE myIdx on JSON PREFIX 1 entity: SCHEMA 
        $.position[0] AS x NUMERIC 
        $.position[1] AS y NUMERIC
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
                    AS: 'id'
                },
                '$.position[0]': {
                    type: SchemaFieldTypes.NUMERIC,
                    AS: 'x'
                },
                '$.position[1]': {
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
                PREFIX: JSON_DOC_ENTITY_PREFIX  
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
        if (!entityJson) return {};
        return JSON.parse(entityJson);
    }

    async updateEntity(entity) {
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

        const results = await promises.exec();

        return results.map((result) => result === 'OK');
    }


    async insertEntityJson(entity) {
        return await this.updateEntityJson(entity);
    }

    async getEntityByIdFtSearch(id) {
        const client = await this.client;
        const results = await client.ft.search(
            ENTITY_INDEX,
            `@id:${id.replace(/\-/g,'?')}`,
            LIMITOBJ
        ); 
        if (!results) return [];
        const { documents } = results;
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
            `@ownerId:${ownerId}`,
            LIMITOBJ
        ); 
        if (!results) return [];
        const { documents } = results;
        const entities = documents.map((document) => {
            const { id: documentId, value: entity } = document;
            return entity;
        });
        return entities;
    }

    async getEntityNearPosition(position, range) {
        const [x, y] = position;
        if (!position || x == null || y == null) return [];
    
        const client = await this.client;
        const results = await client.ft.search(
            ENTITY_INDEX,
            `@x:[${x - range} ${x + range}] @y:[${y - range} ${y + range}]`,
            LIMITOBJ
        ); 
        if (!results) return [];
        const { documents } = results;
        const entities = documents.map((document) => {
            const { id: documentId, value: entity } = document;
            return entity;
        });
        return entities;
    }

    async getEntitiesNearEntities({entities, ignoreId = null, defaultRange = 4}) {
        if (!entities?.length) return [];
        const client = await this.client;
        const promises = entities.reduce((accumulator, entity) => {
            const { position: [ x, y ], sightRange } = entity;
            const range = sightRange ? sightRange : defaultRange;
            return accumulator.ft.search(ENTITY_INDEX,
                `@x:[${x - range} ${x + range}] @y:[${y - range} ${y + range}] -@ownerId:${ignoreId}`,
                    LIMITOBJ
                )
        
        }, client.multi())
        
        const results = await promises.exec();
        
        const reducedResults = results.reduce((accumulator, result) => {
            const foundEntities = result.documents.map(doc => doc.value);
            return uniqBy(accumulator.concat(foundEntities), 'id')
        },[] );
        
        const uniqueResults = uniqBy(reducedResults, 'id');
        return uniqueResults
    }

    async getAllEntities() {
        const client = await this.client;
        const results = await client.ft.search(
            ENTITY_INDEX,
            `*`,
            LIMITOBJ
        ); 
        if (!results) return [];
        const { documents } = results;
        const entities = documents.map((document) => {
            const { id: documentId, value: entity } = document;
            return entity;
        });
        return entities;
    }
}

module.exports = EntityStateDS;