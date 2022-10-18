const { getPlayerFromToken } = require('./authTokens');
const { getJWTSecretAndQuit } = require('../db/redis/redis');

const createContext = async (args) => {
    const { req } = args;
    const token = req.headers.authorization || 'NOTOKEN';
    const secret = await getJWTSecretAndQuit();
    const player = getPlayerFromToken(token, secret);
    return {
        player,
        secret
    }
}

exports.createContext = createContext;