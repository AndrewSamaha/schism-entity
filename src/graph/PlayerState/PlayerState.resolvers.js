module.exports = {
    Query: {
        updatePlayerState: async (_, args, { dataSources }) => {
            const { player } = args;
            if (!player) return false;
            const { playerStateDS } = dataSources;
            return await playerStateDS.updatePlayerState({
                ...player
            })
        },
        getPlayerState: async (_, { id }, { dataSources: { playerStateDS } }) => {
            return await playerStateDS.getPlayerState(id);
        },
        getAllPlayerStates: async (_, __, { dataSources: { playerStateDS } }) => {
            return await playerStateDS.getAllPlayerStates();
        }
    },
    Mutation: {
        updateMyPosition: async (_, { position }, { player, dataSources: { playerStateDS } }) => {
            if (!player?.id) return;
            const { id } = player;
            const playerState = await playerStateDS.getPlayerState(id)
            if (!playerState) return false;
            return await playerStateDS.updatePlayerState({
                ...playerState,
                position
            });
        },
        incrementMyResource: async (_,  { resource, amount }, { player, dataSources: { playerStateDS } }) => {
            if (!player?.id) return false;
            return await playerStateDS.incrementResource(player.id, resource, amount);
        },
        incrementResource: async (_,  { playerId, resource, amount }, { dataSources: { playerStateDS } }) => {
            return await playerStateDS.incrementResource(playerId, resource, amount);
        },
    }
}