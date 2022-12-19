const { RESTDataSource } = require("apollo-datasource-rest");

const { PLAYER_STATE_INDEX, PLAYER_STATE_INDEX_SHAPE, JSON_DOC_PLAYERSTATE_PREFIX, LIMITOBJ } = require('../constants/redis');

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

        const documentName = `${JSON_DOC_PLAYERSTATE_PREFIX}${id}`;
        await client.json.set(documentName, '$', player);

        return true;
    }

    async getPlayerState(id) {
        const client = await this.client;
        console.log('playerStateDS id=',id)
        const documentName = `${JSON_DOC_PLAYERSTATE_PREFIX}${id}`;
        console.log('documentName',documentName)
        const player = await client.json.get(documentName);
        console.log('player',player)
        if (!player) return {
            id: '0',
            name: 'noPlayer',
            position: [0,0],
            resourceState: {
                gold: 0,
                wood: 0,
                stone: 0,
                food: 0
            }
        }
        
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