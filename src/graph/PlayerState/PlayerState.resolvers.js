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
    }
}