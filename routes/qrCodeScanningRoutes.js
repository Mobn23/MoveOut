const express = require("express");

const router = express.Router();

const { body, validationResult } = require('express-validator');

const moveOutBoxesContent = require("../src/moveout-boxes-content");

const utils = require("../src/utils");

// In-memory storage for PINs (replace with database in production)
const pinStorage = new Map();

const path = require('path');

const fs = require('fs');




router.get('/:labelId', async (req, res) => {
    const labelId = req.params.labelId;

    try {
        const boxData = await moveOutBoxesContent.getBoxContent(labelId);

        if (!boxData || boxData.length === 0) {
            return res.status(404).send('Box not found');
        }

        const pin = utils.generatePIN();

        pinStorage.set(labelId, { pin, timestamp: Date.now() });
        console.log("pin code: ", pin);
        // console.log("pin code, labelId, boxData:", pin, labelId, boxData);

        const pageTitle = "box content";

        res.render("moveout/pin-code.ejs", { labelId, pageTitle });
    } catch (error) {
        console.error("Error fetching box content:", error);
        res.status(500).send('An error occurred while fetching box content');
    }
});

router.post('/:labelId/verify', 
    body('pin').isLength({ min: 6, max: 6 }).isNumeric(),
    async (req, res) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const labelId = req.params.labelId;

        const { pin } = req.body;

        const storedPinData = pinStorage.get(labelId);

        if (!storedPinData || storedPinData.pin !== pin) {
            return res.status(401).json({ error: 'Invalid PIN' });
        }

        // Check if PIN is expired (After 2 minutes)
        if (Date.now() - storedPinData.timestamp > 2 * 60 * 1000) {
            pinStorage.delete(labelId);
            return res.status(401).json({ error: 'PIN expired' });
        }

        try {
            const boxData = await moveOutBoxesContent.getBoxContent(labelId);
            
            if (!boxData || boxData.length === 0) {
                return res.status(404).send('Box not found');
            }

            //We added the fileContent property to each item in the boxData array. 
            boxData.forEach(item => {
                if (item.boxes_content_file_type.startsWith('text/plain')) {
                    const filePath = path.join(__dirname, '../public/multer-uploads', item.boxes_content_file_path);
                    item.fileContent = fs.readFileSync(filePath, 'utf8'); // Read file content
                }
            });

            //This prints the current path for Debugging.
            // boxData.forEach(item => {
            //     const fullPath = path.join(__dirname, '../');
            //     console.log(`Full path for ${item.boxes_content_orginal_name}:`, fullPath);
            // });

            // Remove the used PIN
            pinStorage.delete(labelId);

            const pageTitle = "Box content";

            res.render("moveout/display-box-content.ejs", { boxData, pageTitle });
        } catch (error) {
            console.error("Error fetching box content:", error);
            res.status(500).send('An error occurred while fetching box content');
        }
    }
);

module.exports = router;