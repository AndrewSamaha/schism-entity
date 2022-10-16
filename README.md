# schism-entity
This service is responsible for maintaining and serving entity state stored in a redis cache to other services via GraphQL.

# redis-cli commands
- Flush all data `flushall`
- Create Index: 
    ```
    FT.CREATE entityIdx on JSON PREFIX 1 entity: SCHEMA 
        $.position[0] AS x NUMERIC 
        $.position[1] AS y NUMERIC
        $.name AS name TEXT  
    ```

# Local Development
1. The redis-cli package in NPM currently doesn't support JSON indices. So, another packge is necessary.

# Seed Data
```
[
    {
        "id": "bugD",
        "name": "testEntity",
        "longName": "This is a bug type D",
        "speed": 3.3,
        "ownerId": "player.1",
        "position": [12, 12],
        "color": "red",
        "sightRange": 5
    },
    {
        "id": "bugB",
        "name": "testEntity",
        "longName": "This is a bug type b",
        "speed": 3.4,
        "ownerId": "player.1",
        "position": [12, 10],
        "color": "red",
        "sightRange": 5
    },
    {
        "id": "bugA",
        "name": "testEntity",
        "longName": "This is a bug type A",
        "speed": 3.3,
        "ownerId": "player.1",
        "position": [10, 10],
        "color": "red",
        "sightRange": 5
    },
    {
        "id": "bugC",
        "name": "testEntity",
        "longName": "This is a bug type C",
        "speed": 3.5,
        "ownerId": "player.1",
        "position": [10, 12],
        "color": "red",
        "sightRange": 5
    },
    {
        "id": "bugH",
        "name": "bugH",
        "longName": "This is a bug type H",
        "speed": 3.2,
        "ownerId": "player.2",
        "position": [13, 13],
        "color": "red",
        "sightRange": 5
    },
    {
        "id": "bugG",
        "name": "bugG",
        "longName": "This is a bug type G",
        "speed": 3.5,
        "ownerId": "player.2",
        "position": [11, 13],
        "color": "red",
        "sightRange": 5
    },
    {
        "id": "bugE",
        "name": "bugE",
        "longName": "This is a bug type E",
        "speed": 3.3,
        "ownerId": "player.2",
        "position": [11, 11],
        "color": "red",
        "sightRange": 5
    },
    {
        "id": "bugF",
        "name": "bugF",
        "longName": "This is a bug type f",
        "speed": 3.4,
        "ownerId": "player.2",
        "position": [13, 11],
        "color": "red",
        "sightRange": 5
    }
]
```
