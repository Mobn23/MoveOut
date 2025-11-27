/**
 * The functions module.
 * @author mo bn
 */

"use strict";

// Node mailer library variables for sending verification email with verification link.
const nodemailer = require('nodemailer');

const APIKey = process.env.SMTP_KEY_VALUE;

const DOMAIN = process.env.SERVER_DOMAIN;

const senderEmail = process.env.SENDER_EMAIL;

const SMTPUserLogin = process.env.SMTP_USER;

// qr code library variables for generating and combining qr code with image and aving it in public/combined_labels.
const QRCode = require('qrcode');

const fs = require('fs');

const path = require('path');

const sharp = require('sharp');

// const generateSecretKey = () => {
//     return crypto.randomBytes(64).toString('hex');
// };

// // Generate a secret key for the session and log it to the console. 
// // Copy the generated key from the console output and save it in your .env file as SECRET_KEY.
// // We need to do this only once so we generate secret key for setting the session up in indexed.js
// const sessionSecretKey = generateSecretKey();
// console.log(`SESSION_SECRET_KEY=${sessionSecretKey}`);

const ngrok = require("@ngrok/ngrok");//Ngrok is a tool that creates secure tunnels to localhost, allowing to expose a local web server to the internet.

const port = 1337;

const multer = require('multer');

const moveOutAdmin = require("../src/moveout-admin");



async function sendVerificationEmail(userEmail, token) {
    const verificationLink = `http://${DOMAIN}/verify?token=${token}`;

    const transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
        user: SMTPUserLogin,
        pass: APIKey
        },
    });

    const mailOptions = {
        from: senderEmail,
        to: userEmail,
        subject: `Verify your account`,
        html: `<a href="${verificationLink}">Click here to verify your email</a>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
}

// Start ngrok and store the URL
let ngrokUrl = null;

async function startNgrok() {
    try {
        if (!ngrokUrl) {
            const listener = await ngrok.forward({
                addr: port, // server port
                authtoken: process.env.NGROK_AUTH_TOKEN,
            });
            ngrokUrl = listener.url(); // Get the URL from the listener
            console.log("ngrok is running at:", ngrokUrl);
        }
        return ngrokUrl;
    } catch (error) {
        console.error("Failed to start ngrok:", error);
        throw error;
    }
}


async function generateQRCode(labelsDesignsId, labelId) {
    try {
        const qrPath = `./public/qr_codes/label${labelsDesignsId}.png`;
        
        if (!ngrokUrl) {
            await startNgrok();
        }

        const stringId = String(labelId);
        const qrUrl = `${ngrokUrl}/content/label/${stringId}`;
        console.error("qrUrl", qrUrl);

        await QRCode.toFile(qrPath, qrUrl, { width: 125 });
        return qrPath;
    } catch (err) {
        console.error("Error generating QR code:", err);
        throw err;
    }
}

// Make sure to call this when application starts
async function initializeNgrok() {
    try {
        await startNgrok();
    } catch (error) {
        console.error("Failed to initialize ngrok:", error);
    }
}

function placeQRCode() {
    const coordinates = { x: 50, y: 122 };

    return coordinates;
}

async function addQRCodeToLabel(labelPath, qrPath) {
    try {
        const combinedLabelsPath = path.join(__dirname, '../','public', './combined_labels'); // Check notes.txt file for explanation.

        if (!fs.existsSync(combinedLabelsPath)) {
            fs.mkdirSync(combinedLabelsPath);
        }
        const outputPath = path.join(combinedLabelsPath, `combined_${Date.now()}.png`);

        const coordinates = placeQRCode();

        await sharp(labelPath)
            .composite([{ input: qrPath,  top: coordinates.y, left: coordinates.x }])
            .toFile(outputPath);

        return outputPath; // Return the path to the combined image
    } catch (err) {
        console.error("Error combining QR code with label:", err);
    }
}

function returnAuth0ConfigObject() {
    const config = {
        authRequired: false,
        auth0Logout: true,
        secret: process.env.SECRET,
        baseURL: 'http://localhost:1337',
        clientID: process.env.AUTH_CLIENT_ID,
        clientSecret: process.env.AUTH_CLIENTSECRET,
        issuerBaseURL: 'https://dev-yt77yejxhlayewxi.eu.auth0.com',
        routes: {
        login: false,
        logout: false,
        callback: '/auth/callback'
        }
    };

    return config;
}

// Custom middleware to check if user is authenticated (manually or via Auth0)
const isAuthenticated = (req, res, next) => {
    if (req.oidc?.isAuthenticated() || req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Generate a random 6-digit PIN
function generatePIN() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/multer-uploads/') // Store files in public/uploads/
    },
    filename: function (req, file, cb) {
        // Keep the original filename but make it URL-safe
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
});

const upload = multer({ storage: storage });


const isAdmin = async (req, res, next) => {
    const protectedPaths = [
        '/users',
        '/content',
        '/categories',
        '/labels',
        '/delete-user',
        '/make-admin',
        '/admin'
    ];

    // Check if the current route is a protected route
    const isProtectedRoute = protectedPaths.some(path => 
        req.path.includes(path) || 
        req.path.includes('/moveout' + path)
    );

    if (!isProtectedRoute) {
        return next();
    }

    try {
        const userId = req.session.userId;

        let errorMessage;
        if (!userId) {
            errorMessage = 'Authentication required';
            return res.redirect('/login');
        }

        const adminRole = await moveOutAdmin.getUserAdminStatus(userId);

        if (adminRole !== 'admin') {
            errorMessage = 'You do not have permission to access admin dashboard';
            const pageTitle = req.session.name ? `${req.session.name}'s Profile` : 'Profile';
            return res.render('moveout/profile.ejs', { pageTitle: pageTitle, error: errorMessage });
        }

        // Store admin status in request object for future middleware/routes
        req.isAdmin = true;
        next();
    } catch (error) {
        console.error('Error checking admin status:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    "sendVerificationEmail": sendVerificationEmail,
    "generateQRCode": generateQRCode,
    "addQRCodeToLabel": addQRCodeToLabel,
    "returnAuth0ConfigObject": returnAuth0ConfigObject,
    "isAuthenticated": isAuthenticated,
    "startNgrok": startNgrok,
    "initializeNgrok": initializeNgrok,
    "generatePIN": generatePIN,
    "upload": upload,
    "isAdmin": isAdmin
};
