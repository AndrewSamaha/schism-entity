const { createClient } = require('redis');
const { generateAuthToken } = require('../../helpers/authTokens');
const PLAYER_JWT_SECRET_KEY = 'playerJwtSecret';

const redisClient = createClient();

redisClient.on('error', (err) => console.log('Redis client Error', err));

const redisConfig = {
    url: 'redis://localhost:6379'
};

const returnRedisConnection = async () => {
    await redisClient.connect(redisConfig);
    return redisClient;
}

const getJWTSecretAndQuit = async () => {
    const client = createClient();
    client.connect(redisConfig);
    const secret = await client.get(PLAYER_JWT_SECRET_KEY);
    if (secret) {
        client.quit();
        return secret
    };
    const newSecret = generateAuthToken();
    await client.set(PLAYER_JWT_SECRET_KEY, newSecret);
    client.quit();
    return newSecret;
}

module.exports = {
    returnRedisConnection,
    getJWTSecretAndQuit
}
