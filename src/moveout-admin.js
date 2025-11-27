/**
 * The functions module.
 * @author mo bn
 */

"use strict";

const mysql = require("promise-mysql");
const config = require("../config/db/moveout.json");



// We can use here boxId or labelId to get the content because it's the same as we have 1-to-1 relationship between storage boxes and boxes labels.
async function displayActivityLogs() {
    const db = await mysql.createConnection(config);
    let sql = `CALL display_whole_logs_table();`;
    const [res] = await db.query(sql);
    // console.log("displayActivityLogs src: ", res,"displayActivityLogs res[0]",res[0]);
    return res;
}

async function displayAllUsers() {
    const db = await mysql.createConnection(config);
    let sql = `CALL display_all_users();`;
    const [res] = await db.query(sql);
    // console.log("displayAllUsers src: ", res,"displayAllUsers res[0]",res[0]);
    return res;
}

async function displayAllLabels() {
    const db = await mysql.createConnection(config);
    let sql = `CALL display_all_labels();`;
    const [res] = await db.query(sql);
    // console.log("displayAllLabels src: ", res,"displayAllLabels res[0]",res[0]);
    return res;
}

async function displayAllCategories() {
    const db = await mysql.createConnection(config);
    let sql = `CALL display_all_categories();`;
    const [res] = await db.query(sql);
    // console.log("displayAllCategories src: ", res,"displayAllCategories res[0]",res[0]);
    return res;
}

async function displayAllContent() {
    const db = await mysql.createConnection(config);
    let sql = `CALL display_all_content();`;
    const [res] = await db.query(sql);
    // console.log("displayAllContent src: ", res,"displayAllContent res[0]",res[0]);
    return res;
}

async function makeUserAdminById(userId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL make_user_admin(?);`;
    await db.query(sql, [ userId ]);
}

async function deleteUser(userId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL delete_user_cascade(?);`;
    await db.query(sql, [ userId ]);
}

async function getUserAdminStatus(userId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL return_role_status(?);`;
    const [res] = await db.query(sql, [ userId ]);
    console.log("getUserAdminStatus src: ", res,"getUserAdminStatus res[0]",res[0]);
    return res[0].role;
}

module.exports = {
    "displayActivityLogs": displayActivityLogs,
    "displayAllUsers": displayAllUsers,
    "displayAllLabels": displayAllLabels,
    "displayAllCategories": displayAllCategories,
    "displayAllContent": displayAllContent,
    "makeUserAdminById": makeUserAdminById,
    "deleteUser": deleteUser,
    "getUserAdminStatus": getUserAdminStatus
};
