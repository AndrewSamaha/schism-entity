const path = require('path')
const { loadFilesSync } = require('@graphql-tools/load-files')
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge')

const typesArray = loadFilesSync(path.join(__dirname, './**/*'), { 
    extensions: ['graphql'], 
    recursive: true 
})

const mergedTypeDefs = mergeTypeDefs(typesArray);

const resolversArray = loadFilesSync(path.join(__dirname, './**/*.resolvers.*'), { 
    extensions: ['js'], 
    recursive: true 
})

const mergedResolvers = mergeResolvers(resolversArray);

module.exports.typeDefs = mergedTypeDefs;
module.exports.resolvers = mergedResolvers;
