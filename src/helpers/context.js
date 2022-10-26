const { GraphQLError } = require('graphql');
const { getPlayerFromToken } = require('./authTokens');
const { getJWTSecretAndQuit } = require('../db/redis/redis');

const createContext = async (args) => {
    const { req } = args;
    const token = req.headers.authorization || 'NOTOKEN';
    const secret = await getJWTSecretAndQuit();
    const player = getPlayerFromToken(token, secret);
    // if (!player || !player.loggedIn) {
    //     // schism-entity requires the following to be queried:
    //     //  1. an authenticated a user
    //     throw new GraphQLError("you must be logged in to query this schema", {
    //         extensions: {
    //             code: 'UNAUTHENTICATED',
    //         },
    //     });
    // }
    return {
        player,
        secret
    }
}

exports.createContext = createContext;