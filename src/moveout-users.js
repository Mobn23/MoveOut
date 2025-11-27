/**
 * The functions module.
 * @author mo bn
 */

"use strict";

const mysql = require("promise-mysql");
const config = require("../config/db/moveout.json");

async function createUser(
    email,
    hashedPassword = null,
    verificationToken = null,
    username,
    googleId = null,
    provider = 'local',
    profilePicture = null
    ) {
    const db = await mysql.createConnection(config);
    let sql = `CALL insert_user(?, ?, ?, ?, ?, ?, ?);`;
    const res = await db.query(sql, [
        email, 
        hashedPassword, 
        verificationToken, 
        username, 
        googleId, 
        provider,
        profilePicture
    ]);

    console.log('Inserting data:', { 
        email, 
        hashedPassword, 
        verificationToken, 
        username, 
        googleId, 
        provider, 
        profilePicture
    });

    // console.log("res[0] in src/moveout-users.js/createUser", res[0]);
    // return res[0];
}

async function verifyUserByToken(token) {
    const db = await mysql.createConnection(config);
    let sql = `CALL verify_user_by_token(?);`;
    const res = await db.query(sql, [token]);

    console.log(res[0]);
    return res[0];
}

async function getUserByEmail(email) {
    const db = await mysql.createConnection(config);
    let sql = `CALL get_user_by_email(?);`;
    const [res] = await db.query(sql, [email]);
    // [res] is Array Destructuring(So we distruct the array and reach the returned data direct
    // (which are 2 objects in this case then we return res[0] to get only the user's data)).

    console.log("getUserByEmail results", res);
    return res[0];
}

async function saveGoogleUserToDatabase(userData) {
    const db = await mysql.createConnection(config);

    const email = userData.email;

    const name = userData.name;

    const verified = userData.email_verified;

    const google_id = userData.user_id;

    const provider = 'google';

    const picture = userData.profile_picture;

    let sql = `CALL insert_google_user_data(?,?,?,?,?,?);`;
    const [res] = await db.query(sql, [email, name, verified, google_id, provider, picture]);

    // console.log("saveGoogleUserToDatabase res , res[0]", res, res[0]);
    return res[0];
}


module.exports = {
    "createUser": createUser,
    "verifyUserByToken": verifyUserByToken,
    "getUserByEmail": getUserByEmail,
    "saveGoogleUserToDatabase": saveGoogleUserToDatabase
};
