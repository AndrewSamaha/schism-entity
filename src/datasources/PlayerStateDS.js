const { RESTDataSource } = require("apollo-datasource-rest");

const { PLAYER_STATE_INDEX, PLAYER_STATE_INDEX_SHAPE, JSON_DOC_PLAYERSTATE_PREFIX, LIMITOBJ } = require('../constants/redis');

const getDocName = (playerId) => `${JSON_DOC_PLAYERSTATE_PREFIX}${String(playerId).replace(/^(player)+([\.\:])+/,'')}`;

class PlayerStateDS extends RESTDataSource {
    /// https://www.apollographql.com/docs/apollo-server/data/data-sources/
    constructor(client) {
        super();
        this.client = client;
        this.createPlayerIndex();
    }

    async createPlayerIndex() {
        const client = await this.client;
        let indexExists = null;
        try {
            indexExists = await client.ft.info(PLAYER_STATE_INDEX);
            console.log('createPlayerIndex indexExists:',PLAYER_STATE_INDEX);
        } catch (e) {
            console.log('createPlayerIndex exception', e, PLAYER_STATE_INDEX);
        }
        if (indexExists) return;
        
        /*
        {
            player:202000202
            {
                id,
                name,

                viewport: [x, y],
                resources: {
                    gold
                    wood
                    food
                }
            }
        }
        */
        try {
            await client.ft.create(PLAYER_STATE_INDEX, PLAYER_STATE_INDEX_SHAPE, {
                ON: 'JSON',
                PREFIX: JSON_DOC_PLAYERSTATE_PREFIX  
            });
            console.log('createPlayerIndex already exists');
        } catch (e) {
            console.log('createPlayerIndex exception:', e)
        }
        
        
    }


    async updatePlayerState(player) {
        const { id } = player;
        const client = await this.client;
        await client.json.set(getDocName(id), '$', player);
        return true;
    }

    async incrementResource(playerId, resource, amount) {
        const client = await this.client;
        return await client.json.numIncrBy(getDocName(playerId), `resourceState.${resource}`, amount)
    }

    async getPlayerState(id) {
        const client = await this.client;
        const player = await client.json.get(getDocName(id));
        if (!player) return null;
        
        return player;
    }

    async getAllPlayerStates() {
        const client = await this.client;
        const results = await client.ft.search(
            PLAYER_STATE_INDEX,
            `*`,
            LIMITOBJ
        ); 
        if (!results) return [];
        const { documents } = results;
        const players = documents.map((document) => {
            const { value: player } = document;
            return player;
        });
        return players;
    }
}

module.exports = PlayerStateDS;