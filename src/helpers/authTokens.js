const { randomBytes } = require('crypto');
const jwt = require('jsonwebtoken');

const generateAuthToken = () => {
    console.log('generateAuthToken: secret has been created')
    return randomBytes(48).toString('hex')
};

const getPlayerFromToken = (token, secret) => {
    if (!secret) {
        console.log('getPlayerFromToken secret=null')
        return null
    };
    const noPlayer = { loggedIn: false, id: null };
    const player = { loggedIn: true, id: null };
    if (process.env.DEVELOPMENT && token === 'DEVELOPMENT') {
        player.id = 1;
        console.log('getPlayerFromToken returning dev player')
        return player;
    }
    try {
        const payload = jwt.verify(token, secret);
        player.id = payload.id;
    } catch (e) {
        noPlayer.error = e.message;
        console.log({secret, token});
        console.log(e)
        console.log(e.message)
        return noPlayer;
    }
    return player;
}

exports.generateAuthToken = generateAuthToken;
exports.getPlayerFromToken = getPlayerFromToken;