const dotenv = require('dotenv');

dotenv.config();

const express = require('express');

const app = express();

const session = require('express-session');

const boxesLabelsRoutes = require("./routes/boxesLabelsRoutes");

const contentRoutes = require("./routes/contentRoutes");

const registrationLoginRoutes = require("./routes/registrationLoginRoutes");

const port = 1337;

const path = require('path');

// bodyParser parses automatically in the routes so i use the data direct in the routes without parsing it maniually.
const bodyParser = require('body-parser');

const urlencodedParser = bodyParser.urlencoded({ extended: false });

// extended: false: Uses the querystring library to parse URL-encoded data. This supports only simple key-value pairs.
// extended: true: Uses the qs library, allowing for rich objects and arrays to be encoded into the URL-encoded format.

const sessionSecretKey = process.env.SESSION_SECRET_KEY;

const { auth } = require('express-openid-connect');

const utils = require('./src/utils');

const qrCodeScanningRoutes = require("./routes/qrCodeScanningRoutes");

const adminRoutes = require("./routes/adminRoutes");




app.use(session({
    secret: sessionSecretKey,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Set up body-parser middleware first.
app.use(urlencodedParser);
app.use(express.json()); // Add this to parse JSON request bodies

app.set("view engine", "ejs");

const config = utils.returnAuth0ConfigObject();
// console.log("config", config);


// Exclude PIN-based authentication routes from general authentication
app.use('/content/label', qrCodeScanningRoutes);
app.use('/moveout/content/label', qrCodeScanningRoutes);

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

app.use((req, res, next) => {
    // Public routes that don't need authentication
    const publicRoutes = [
        '/login', 
        '/register',
        '/verify',
        '/logout', 
        '/', 
        '/auth/login', 
        '/content/label', 
        '/uploads', 
        '/multer-uploads'
    ];

    // Exclude requests to the public routes and static files (CSS, JS, images, etc.)
    const staticFileRegex = /\.(css|js|png|jpg|jpeg|gif|ico|svg|mp3)$/;

    if (publicRoutes.includes(req.path) || staticFileRegex.test(req.path)) {
        return next(); // Skip authentication for public routes and static files
    }

    // Apply isAuthenticated for all other routes
    return utils.isAuthenticated(req, res, next);
});


app.use("/", registrationLoginRoutes);
app.use("/moveout", registrationLoginRoutes);

app.use("/", boxesLabelsRoutes);
app.use("/moveout", boxesLabelsRoutes);

app.use("/", contentRoutes);
app.use("/moveout", contentRoutes);

// We apply admin check middleware to all admin routes.
app.use(async (req, res, next) => {
    await utils.isAdmin(req, res, next);
});

app.use("/", adminRoutes);
app.use("/moveout/admin", adminRoutes);



app.use(express.static("public"));


app.listen(port, () => {
    console.log(`Server is listening on port: ${port}`);
});


app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});

// Intialize the ngrok with the server initiation.
utils.initializeNgrok();

// Summary:
// URL Encoding/Decoding: Used when transmitting form data or query parameters in URLs.
// JSON Stringify/Parse: Used for handling JSON data in request bodies or responses.
// Other Encodings: Depending on the content type, other encoding/decoding methods might be used (e.g., XML, multipart form data).

// So the encoding is built-in html quit similar to the restful API when we send request so there we stringify and encoding . so now we parse and decoding
