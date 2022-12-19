const { SchemaFieldTypes } = require("redis");

const PLAYER_JWT_SECRET_KEY = 'playerJwtSecret';
const ENTITY_INDEX = 'entityIdx';
const JSON_DOC_ENTITY_PREFIX = 'entity:';
const LIMIT = 1000;
const LIMITOBJ = {
        LIMIT: {
            from: 0,
            size: LIMIT
        }
    };

const JSON_DOC_PLAYERSTATE_PREFIX = 'player:';
const PLAYER_STATE_INDEX = 'playerIdx';
const PLAYER_STATE_INDEX_SHAPE = {
    '$.id': {
        type: SchemaFieldTypes.TEXT,
        AS: 'id'
    },
    '$.name': {
        type: SchemaFieldTypes.TEXT,
        AS: 'name'
    },
    '$.viewport[0]': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'x'
    },
    '$.viewport[1]': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'y'
    }
};

module.exports = {
    PLAYER_JWT_SECRET_KEY,
    ENTITY_INDEX,
    JSON_DOC_ENTITY_PREFIX,
    LIMITOBJ,
    JSON_DOC_PLAYERSTATE_PREFIX,
    PLAYER_STATE_INDEX,
    PLAYER_STATE_INDEX_SHAPE
}
