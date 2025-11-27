/**
 * The functions module.
 * @author mo bn
 */

"use strict";

const mysql = require("promise-mysql");
const config = require("../config/db/moveout.json");


async function createCategory(categoryName) {
    const db = await mysql.createConnection(config);
    let sql = `CALL insert_category(?);`;
    const [res] = await db.query(sql, [categoryName]);
    // console.log('Inserting data:', { categoryName });
    const categoryId = res[0].category_id;
    return categoryId;
}

async function displayLabelsDesigns() {
    const db = await mysql.createConnection(config);
    let sql = `CALL display_labels_designs()`;
    const [res] = await db.query(sql);

    // console.log([res]);
    return res;
}

async function createStorageBox(app_user_id, content_category_id) {
    const db = await mysql.createConnection(config);
    let sql = `CALL insert_storage_boxes(?,?);`;
    const [res] = await db.query(sql, [app_user_id, content_category_id]);
    // console.log('Inserting data:', { app_user_id, content_category_id });

    const storageBoxesId = res[0].storage_box_id;
    return storageBoxesId;
}

async function createLabel(storageBoxesId, labelsDesignsId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL insert_label(?,?);`;
    const [res] = await db.query(sql, [storageBoxesId, labelsDesignsId]);
    // console.log('Inserting data:', { storageBoxesId, labelsDesignsId });
    const labelId = res[0].label_id;
    return labelId;
}

async function getLabelPathById(id) {
    const db = await mysql.createConnection(config);
    let sql = `CALL get_label_path_by_id(?);`;
    const [res] = await db.query(sql, [id]);

    const labelPath = res[0].image_path;
    return labelPath;
}

async function createCombinedLabelWithQRcode(relativeCombinedLabelPath, boxes_labels_id) {
    const db = await mysql.createConnection(config);
    let sql = `CALL insert_to_combined_labels_with_qrcodes(?,?);`;
    const [res] = await db.query(sql, [relativeCombinedLabelPath, boxes_labels_id]);
    // console.log('Inserting data:', { relativeCombinedLabelPath, boxes_labels_id });
    const combinedLabelWithQRcodeId = res[0].combined_label_with_qrcode_id;
    return combinedLabelWithQRcodeId;
}

async function getBoxLabelByStorageBoxId(storageBoxId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL get_label_data_by_storage_box_id(?);`;
    const [res] = await db.query(sql, [storageBoxId]);

    const labelData = res[0];

    // console.log('Box label data:', labelData);
    return labelData;
}

async function getCombinedLabelWithQRCodeDataByLabelId(clickedLabelId) {
    const db = await mysql.createConnection(config);
    let sql = `CALL get_combined_label_with_qrcode_data_by_label_id(?);`;
    const [res] = await db.query(sql, [clickedLabelId]);

    const CombinedLabelWithQRCodeData = res[0];

    // console.log('CombinedLabelWithQRCodeData:', CombinedLabelWithQRCodeData);
    return CombinedLabelWithQRCodeData;
}


module.exports = {
    "createCategory": createCategory,
    "displayLabelsDesigns": displayLabelsDesigns,
    "createStorageBox": createStorageBox,
    "createLabel": createLabel,
    "getLabelPathById": getLabelPathById,
    "createCombinedLabelWithQRcode": createCombinedLabelWithQRcode,
    "getBoxLabelByStorageBoxId": getBoxLabelByStorageBoxId,
    "getCombinedLabelWithQRCodeDataByLabelId": getCombinedLabelWithQRCodeDataByLabelId
};
