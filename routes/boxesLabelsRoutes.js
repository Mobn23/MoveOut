// The main router.
const express = require("express");

const router = express.Router();

const { body, validationResult } = require('express-validator');

const utils = require("../src/utils");

const path = require("path");

const moveOutBoxesLabels = require("../src/moveout-boxes-labels");

const moveOutBoxesContent = require("../src/moveout-boxes-content");

const upload = utils.upload;







router.post('/upload/additional/files', upload.array('file'), async (req, res) => {
    try {
        const storageBoxId = req.body.boxId;
        const updatedCategory = req.body.category;
        let boxesContentId = null;

        // Only create new box content if files were uploaded
        if (req.files && req.files.length > 0) {
            const uploadedFiles = req.files.map(file => ({
                originalName: file.originalname,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size
            }));

            boxesContentId = await moveOutBoxesContent.createBoxContent(
                req.body.textContent || null,
                uploadedFiles[0]?.filename || null,
                uploadedFiles[0]?.originalName || null,
                uploadedFiles[0]?.mimetype || null,
                uploadedFiles[0]?.size || null,
                req.session.storageBoxesId || null,
                req.session.combinedLabelWithQRcodeId || null
            );
        }

        // Update category if provided, regardless of file upload
        if (updatedCategory && storageBoxId) {
            await moveOutBoxesContent.updateContentCategory(storageBoxId, updatedCategory);
        }

        // Return appropriate response
        const response = {
            message: 'Operation completed successfully'
        };

        if (boxesContentId) {
            response.boxesContentId = boxesContentId;
            response.files = req.files.map(file => ({
                originalName: file.originalname,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size
            }));
        }

        res.json(response);
    } catch (error) {
        console.error('Error in upload route:', error);
        res.status(500).json({ 
            message: 'An error occurred during the upload process',
            error: error.message 
        });
    }
});

router.get('/edit/label/:box_id', async (req, res) => {
    // console.log("get('/edit/label)");
    const boxId = req.params.box_id;

    const labelInfo = await moveOutBoxesLabels.getBoxLabelByStorageBoxId(boxId);

    // console.log("Label Info:", labelInfo);
    const clickedLabelId = labelInfo ? labelInfo.id : null; // Handle if result is null/undefined

    const boxContent = await moveOutBoxesContent.getBoxContent(boxId);

    const relativeCombinedLabelData = await moveOutBoxesLabels.getCombinedLabelWithQRCodeDataByLabelId(clickedLabelId);

    const relativeCombinedLabelPath = relativeCombinedLabelData.relative_combined_label_path;

    if (!boxContent) {
        console.error(`No content found for box with ID: ${boxId}`);
    }    

    // console.log("relativeCombinedLabelPath, clickedLabelId, boxId, boxContent:", relativeCombinedLabelPath, clickedLabelId, boxId, boxContent);
    let pageTitle= "Edit lable";

    // console.log("Current session", req.session);
    res.render("moveout/labels-edit.ejs", {
        pageTitle: pageTitle,
        labelPath: relativeCombinedLabelPath,
        boxId: boxId,
        clickedLabelId: clickedLabelId,
        boxContent: boxContent
    });
});

router.get('/label/customize', async (req, res) => {
    // console.log("get('/label/customize)");
    let relativeCombinedLabelPath = "";

    if (!req.session.combinedLabelWithQRcodeId){
        const labelsDesignsId = req.session.labelsDesignsId;

        const labelFileName = await moveOutBoxesLabels.getLabelPathById(labelsDesignsId);

        const labelPath = path.join(__dirname, '..', 'public', labelFileName);

        const labelId = req.session.labelId;

        const qrPath = await utils.generateQRCode(labelsDesignsId, labelId);

        const combinedLabelPath = await utils.addQRCodeToLabel(labelPath, qrPath);

        relativeCombinedLabelPath = combinedLabelPath.replace(/^.*[\\\/]public[\\\/]/, '/');

        const combinedLabelWithQRcodeId = await moveOutBoxesLabels.createCombinedLabelWithQRcode(relativeCombinedLabelPath, labelId);

        req.session.relativeCombinedLabelPath = relativeCombinedLabelPath;
        req.session.combinedLabelWithQRcodeId = combinedLabelWithQRcodeId;
    }
    relativeCombinedLabelPath = req.session.relativeCombinedLabelPath;
    delete req.session.combinedLabelWithQRcodeId;
    // console.log("Current session after deleting:", req.session);
    let pageTitle= "Lable customize";

    let welcome = `
        Customize your lable!
    `;

    // console.log("Current session", req.session);
    res.render("moveout/label-customize.ejs", {
        pageTitle: pageTitle,
        welcome: welcome,
        labelPath: relativeCombinedLabelPath
    });
});

router.post('/labels', async (req, res) => {
    const categoryId = req.session.categoryId;

    const appUserId = req.session.userId;

    // console.log("session appUserId , labelId", appUserId , labelId);
    const storageBoxesId = await moveOutBoxesLabels.createStorageBox(appUserId, categoryId);

    const { labelsDesignsId } = req.body;

    // console.log("req.body", req.body);
    if (!labelsDesignsId) {
        return res.status(400).json({ message: "Label ID not fetched successfully" });
    }

    const labelId = await moveOutBoxesLabels.createLabel(storageBoxesId, labelsDesignsId);

    req.session.labelsDesignsId = labelsDesignsId;
    req.session.labelId = labelId;
    req.session.storageBoxesId = storageBoxesId;

    res.json({ success: true, redirectUrl: "/label/customize" });
});


module.exports = router;
