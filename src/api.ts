const initSqlJs = require('sql.js');

/**
 * Initialize the in-memory database with some dummy
 * values.
 */
async function init() {
    const sql = await initSqlJs({ });
    const db = new sql.Database();

    // Create the pets table and add some values
    db.run("CREATE TABLE pets (id int, name varchar);");
    db.run("INSERT INTO pets VALUES (1, 'Bailey');");
    db.run("INSERT INTO pets VALUES (2, 'Miley');");
    db.run("INSERT INTO pets VALUES (3, 'Chip');");

    db.run("CREATE TABLE owners (id int, name varchar);");
    db.run("INSERT INTO owners VALUES (1, 'Wesley Gamble');");
    db.run("INSERT INTO owners VALUES (2, 'Mallory Mathis');");
    db.run("INSERT INTO owners VALUES (3, 'Hasad Macdonald');");

    db.run("CREATE TABLE owners_pets (pet_id int, owner_id int);");
    db.run("INSERT INTO owners_pets VALUES (1, 3);");

    return db;
}

/**
 * Querying the DB returns the data in a separate column, and
 * value form. We preffer the data to be key-value. So this
 * utility function will do that.
 */
function serialize(data) {
    // The database returns data in the following format:
    // [
    //     {
    //         "columns": [ "id", "name" ],
    //         "values": [
    //             [ 1, "doggo" ],
    //             [ 2, "porkbun" ]
    //         ]
    //     }
    // ]

    let result : any[] = [];
    for (let i = 0; i < data[0]["values"].length; i++){
        let row = {};
        for (let j = 0; j < data[0]["columns"].length; j++) {
            row[data[0]["columns"][j]] = data[0]["values"][i][j];
        }
        result.push(row);
    }
    return result;
}

/**
 * Get pets API. Route: /api/pets/
 *
 **/
export const getPets = ((async (event) => {
    // Initialize the DB
    let db = await init();

    // Select all of the pets in the DB
    const result = db.exec("SELECT * FROM pets");

    // Make the results a readable format
    const prettyRestults = serialize(result);

    return { statusCode: 200, body: JSON.stringify(prettyRestults) }
}))


/**
 * Get pets API by ID. Route: /api/pets/{id}
 *
 **/
export const getPetById = ((async (event) => {
    // Initialize the DB
    let db = await init();
    
    let petId : Number = 0
    if (event.pathParameters != undefined) {
        petId = Number(event.pathParameters.id)
    }

    // Prepare an sql statement
    const stmt = db.prepare("SELECT * FROM pets WHERE id=:id ");

    // Bind values to the parameters and fetch the results of the query
    const result = stmt.getAsObject({':id' : petId});

    return { statusCode: 200, body: JSON.stringify(result) }
}))

/**
 * Get an owner by ID. This should return all of the owners perts.
 * Route: /api/owners/{id}
 *
 **/
export const getOwnerById = ((async (event) => {
    // Initialize the DB
    let db = await init();

    let ownerId : Number = 0
    if (event.pathParameters != undefined) {
        ownerId = Number(event.pathParameters.id)
    }

    // Prepare an sql statement and Bind values to the parameters and fetch the results of the query
    const ownerDetailsQuery = db.prepare("SELECT * FROM owners WHERE id=:id ");
    let ownerDetails = ownerDetailsQuery.getAsObject({':id' : ownerId});
    ownerDetailsQuery.free();

    // Get all the pets for this owner
    const ownerPetsQuery = db.prepare("SELECT pets.* FROM pets inner join owners_pets ON owners_pets.pet_id = pets.id where owners_pets.owner_id = :ownerid;");
    const result = ownerPetsQuery.bind({':ownerid' : ownerId});

    ownerDetails.pets = [];
    while(ownerPetsQuery.step()) {
        const row = ownerPetsQuery.getAsObject();
        ownerDetails.pets.push(row)
    }
    ownerPetsQuery.free();

    return { statusCode: 200, body: JSON.stringify(ownerDetails) }
}))

/**
 * Get all the pets that are still lost. This means that they don't have an
 * associated owner in the database.
 * Route: /api/pets/lost
 *
 **/
export const getLostPets = ((async (event) => {
    // Initialize the DB
    let db = await init();

    // TODO: Finish implementation here
    const lostPets : string[] = [];
    const ownerPetsQuery = db.prepare("SELECT pets.* FROM pets inner join owners_pets ON owners_pets.pet_id = pets.id where owners_pets.owner_id <=> ?;");
    //const result = ownerPetsQuery.bind();
    
    while(ownerPetsQuery.step()) {
        const row = ownerPetsQuery.getAsObject();
        lostPets.push(row)
    return { statusCode: 200, body: JSON.stringify(lostPets) }

    }
    
}))








}))

