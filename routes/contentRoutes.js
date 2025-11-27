// The main router.
const express = require("express");

const router = express.Router();

const multer = require('multer');

const moveOutBoxesContent = require("../src/moveout-boxes-content");

const { body, validationResult } = require('express-validator');

const utils = require("../src/utils");

const upload = utils.upload;

const moveOutBoxesLabels = require("../src/moveout-boxes-labels");







router.delete('/content/delete/:contentId', async (req, res) => {
    try {
        const contentId = req.params.contentId;

        // Delete the content record from database
        await moveOutBoxesContent.deleteContent(contentId);

        res.json({ success: true, message: 'Content deleted successfully' });
    } catch (error) {
        console.error('Error deleting content:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting content',
            error: error.message 
        });
    }
});

// router.post('/edit-box-content/:box_id', async (req, res) => {
//     const boxId = req.params.box_id;

//     const boxContent = await moveOutBoxesContent.getBoxContent(boxId);

//     console.log("boxContent /edit-box-content/:box_id: ", boxContent);
//     const pageTitle = "Edit Box's content";

//     res.render('moveout/edit-box-content.ejs', { boxContent: boxContent, pageTitle: pageTitle });
// });

// Example Express route for handling the GET request
router.get('/edit-box-content/:box_id', async (req, res) => {
    const boxId = req.params.box_id;

    try {
        const boxContent = await moveOutBoxesContent.getBoxContent(boxId);

        if (!boxContent || boxContent.length === 0) {
            return res.status(404).send('Box not found');
        }

        // console.log("boxContent /edit-box-content/:box_id: ", boxContent);
        const pageTitle = "Update box content";

        res.render('moveout/edit-box-content.ejs', { boxId, pageTitle, boxContent: boxContent, totalContents: boxContent.length });
    } catch (error) {
        console.error("Error fetching box content:", error);
        res.status(500).send('An error occurred while fetching box content');
    }
});

router.get('/delete-box/:box_id', async (req, res) => {
    try {
        const boxId = req.params.box_id;
        await moveOutBoxesContent.deleteBoxById(boxId);
        res.redirect('/moveout/display/boxes');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting the box label");
    }
});

router.get('/display/boxes', async (req, res) => {
    const appUserId = req.session.userId;

    const storageBoxes = await moveOutBoxesContent.getStorageBoxData(appUserId);

    if (!storageBoxes) {
        return res.status(400).json({ message: "storage boxes not fetched successfully" });
    }
    // console.log("storageBoxes: ", storageBoxes);

    let pageTitle = "Your boxes";

    res.render("moveout/display-boxes.ejs", {
        pageTitle: pageTitle,
        data: storageBoxes
    })
});

router.post('/upload', upload.array('file'), async (req, res) => {
    if (!req.files) {
        return res.status(400).send('No files were uploaded.');
    }

    const uploadedFiles = req.files.map(file => ({
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size
    }));

    const boxesContentId = await moveOutBoxesContent.createBoxContent(
        req.body.textContent || null,
        uploadedFiles[0]?.filename || null,
        uploadedFiles[0]?.originalName || null,
        uploadedFiles[0]?.mimetype || null,
        uploadedFiles[0]?.size || null,
        req.session.storageBoxesId || null,
        req.session.combinedLabelWithQRcodeId || null
    );

    // console.log("boxesContentId", boxesContentId);
    req.session.boxesContentId = boxesContentId;
    res.json({ message: 'Files uploaded successfully', boxesContentId, files: uploadedFiles });
});

router.post('/box/category', async (req, res) => {
    const selectedCategory = req.body.category;

    if(req.session.categoryId){
        delete req.session.categoryId;
    }
    const categoryId = await moveOutBoxesLabels.createCategory(selectedCategory);

    req.session.categoryId = categoryId
    if (!req.session.labels) {
        const labels = await moveOutBoxesLabels.displayLabelsDesigns();
        // console.log("Selected Category:", selectedCategory);
        // console.log("labels:", labels);
        req.session.labels = labels;
    }
    const labels = req.session.labels;

    delete req.session.labels;
    let pageTitle = "Pick a lable!";

    let welcome = `Category: ${selectedCategory}`;

    res.render("moveout/labels.ejs", {
        pageTitle: pageTitle,
        welcome: welcome,
        labels: labels
    });
});

router.get('/box/category', (req, res) => {
    // console.log("get('/box/category')")
    let pageTitle= "content category";

    let welcome = `
        Select content category!
    `;

    res.render("moveout/box-category.ejs", {
        pageTitle: pageTitle,
        welcome: welcome
    });
});

module.exports = router;
