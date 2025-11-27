/**
 * The functions module.
 * @author mo bn
 */

"use strict";

const mysql = require("promise-mysql");
const config = require("../config/db/moveout.json");


async function createBoxContent(
    textContent = null,
    filePath = null,
    originalName = null,
    fileType = null,
    fileSize = null,
    storageBoxesId,
    combinedLabelsWithQRcodesId
    ) {
    const db = await mysql.createConnection(config);
    let sql = `CALL insert_to_boxes_content(?, ?, ?, ?, ?, ?, ?);`;
    const [res] = await db.query(sql, [
        textContent || null,
        filePath || null,
        originalName || null,
        fileType || null, 
        fileSize || null,
        storageBoxesId,
        combinedLabelsWithQRcodesId
    ]);
    // console.log('Inserting data:', { 
    //     textContent, filePath, originalName,
    //     fileType, fileSize, storageBoxesId,
    //     combinedLabelsWithQRcodesId });
    const boxesContentId = res[0].boxes_content_id;
    return boxesContentId;
}

async function getStorageBoxData(appUserId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL display_storage_boxes(?);`;
    const [res] = await db.query(sql, [ appUserId ]);
    // console.log(res);
    return res;
}

async function deleteBoxById( boxId ) {
    const db = await mysql.createConnection(config);
    let sql = `CALL delete_box_by_id(?);`;
    await db.query(sql, [ boxId ]);
}

// We can use here boxId or labelId to get the content because it's the same as we have 1-to-1 relationship between storage boxes and boxes labels.
async function getBoxContent(boxId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL display_box_content(?);`;
    const [res] = await db.query(sql, [ boxId ]);
    // console.log("getBoxContent src: ", res,"getBoxContent res[0]",res[0]);
    return res;
}

async function updateContentCategory(storageBoxId, updatedCategory) {
    const db = await mysql.createConnection(config);
    let sql = `CALL update_content_category(?,?);`;
    await db.query(sql, [ storageBoxId, updatedCategory ]);
}

async function deleteContent(contentId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL delete_piece_of_content(?);`;
    await db.query(sql, [ contentId ]);
}


module.exports = {
    "createBoxContent": createBoxContent,
    "getStorageBoxData": getStorageBoxData,
    "deleteBoxById": deleteBoxById,
    "getBoxContent": getBoxContent,
    "updateContentCategory": updateContentCategory,
    "deleteContent": deleteContent
};
