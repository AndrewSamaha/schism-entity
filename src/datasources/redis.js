const { RESTDataSource } = require("apollo-datasource-rest");
const PLAYER_JWT_SECRET_KEY = 'playerJwtSecret';

// https://github.com/redis/node-redis/tree/2a8e11a51d4f965b2d902bd8e6b041f04d984182/packages/json
// https://github.com/redis/node-redis/tree/2a8e11a51d4f965b2d902bd8e6b041f04d984182/packages/search

class RedisDs extends RESTDataSource {
    /// https://www.apollographql.com/docs/apollo-server/data/data-sources/
    constructor(client) {
        super();
        this.client = client;
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

    async setEntityJson(entity) {
        const { id } = entity;
        const client = await this.client;
        // const entityString = JSON.stringify(entity);
        await client.json.set(id, entityString);
        return true;
    }

    async getEntityByIdJson(id) {
        const client = await this.client;
        const entityJson = await client.get(id);
        console.log('getEntityById',id, entityJson)
        if (!entityJson) return {};
        return JSON.parse(entityJson);
    }
}

module.exports = RedisDs;