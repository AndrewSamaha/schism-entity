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

module.exports = {
    PLAYER_JWT_SECRET_KEY,
    ENTITY_INDEX,
    JSON_DOC_ENTITY_PREFIX,
    LIMITOBJ
}
