// The main router.
const express = require("express");

const router = express.Router();

const moveOutUsers = require("../src/moveout-users");

const bcrypt = require('bcrypt');

const saltRounds = 11;

const { body, validationResult } = require('express-validator');

const crypto = require('crypto');

const utils = require("../src/utils");



// Auth0 login route
router.get('/auth/login', (req, res) => {
    // console.log("Auth login route triggered");
    res.oidc.login({
        returnTo: '/profile',
        authorizationParams: {
            screen_hint: "login",
        },
    });
});

// router.get('/auth/callback', async (req, res) => {
//     console.log("Callback route triggered");

//     if (req.oidc.isAuthenticated()) {
//         console.log("User authenticated, redirecting to /profile");
//         res.redirect('/profile');
//     } else {
//         console.log("User not authenticated, redirecting to login");
//         res.redirect('/auth/login');
//     }
// });

router.get('/profile', async (req, res) => {
    let user;
    let pageTitle;
    let isNewUser = false;

    if (req.oidc) {
        user = req.oidc.user;
        pageTitle = `${user.given_name}'s Profile`;

        // Check if the user logged in using Google
        // const isGoogleLogin = user.sub.includes('google-oauth2');

        let userInfo = await moveOutUsers.getUserByEmail(user.email);

        // console.log("Auth0 User:", user);
        // console.log("DB UserInfo:", userInfo);
        // If the user does not exist in your database, save them
        if (!userInfo) {
            // Save Google user in the database and retrieve the saved user
            userInfo = await moveOutUsers.saveGoogleUserToDatabase(user);
            // console.log("New user registered via Google");
            // console.log("GoogleUserInfo", userInfo);
            isNewUser = true;
        }
        userInfo = await moveOutUsers.getUserByEmail(user.email);
        // console.log("user", user);
        console.log("DBUserInfo", userInfo);
        // Set session userId to the newly created or existing user's ID
        req.session.userId = userInfo.id;

    } else {
        user = { name: req.session.name };
        pageTitle = `${user.name}'s Profile`;
    }

    res.render('moveout/profile.ejs', { pageTitle: pageTitle });
});

// Logout route
router.get('/logout', (req, res) => {
    // If authenticated with Auth0, log out from Auth0
    if (req.oidc?.isAuthenticated()) {
        const returnTo = `${req.protocol}://${req.get('host')}/login`; //return dinamically to the root route.

        req.session.destroy(err => {  // Manually destroy session here before redirecting to Auth0 logout
            if (err) {
                return res.status(500).send('Could not log out.');
            }
            res.oidc.logout({
                returnTo: returnTo, // Redirect back to login page after Auth0 logout
                client_id: process.env.AUTH_CLIENT_ID
            });
        });
    } else {
        // If not authenticated with Auth0, destroy the session manually
        req.session.destroy(err => {
            if (err) {
                return res.status(500).send('Could not log out.');
            }
            res.redirect('/login');
        });
    }
});

router.get("/", (req, res) => {
    if (req.oidc?.isAuthenticated() || req.session.userId) {
        res.redirect('/profile');
    } else {
        let pageTitle = "MoveOut";
        let welcome = `Sign up`;
        res.render("moveout/index.ejs", {
            pageTitle: pageTitle,
            welcome: welcome
        });
    }
});

router.get('/login',
    async (req, res) => {
    const errors = validationResult(req);

    let pageTitle= "login";

    let welcome = `
        Log in
    `;

    if (!errors.isEmpty()) {

        res.render('moveout/login.ejs', {
            errors: errors.array(),
            pageTitle: pageTitle,
            welcome: welcome
        });
    }

    res.render('moveout/login.ejs', {
        pageTitle: pageTitle,
        welcome: welcome
    });
});

router.post('/login',
    [
        body('email')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),
        body('password')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
            .trim().escape()
    ],
    async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        let pageTitle= "login";
        let welcome = `
            Log in
        `;

        res.render('moveout/login.ejs', {
            errors: errors.array(),
            pageTitle: pageTitle,
            welcome: welcome
        });
    }

    const { email, password } = req.body;

    // console.log('email, password posted of login form:', email);
    const userCredentials = await moveOutUsers.getUserByEmail(email);

    if (!userCredentials) {
        return res.status(401).render('moveout/login.ejs', {
            pageTitle: "Login",
            welcome: "Email not found",
            errors: [{ msg: 'Email not found' }, ...errors.array()]
        });
    }

    const userRole = userCredentials.role;

    req.session.userRole = userRole;

    // console.log('userCredentials', userCredentials);
    const name = userCredentials.name;

    req.session.name = name;
    const databaseHashedPassword = userCredentials.password_hash;
    // console.log('Plain text password:', password);
    // console.log('Hashed password from database:', databaseHashedPassword);

    const isMatch = await bcrypt.compare(password, databaseHashedPassword);

    if (!isMatch) {
        let pageTitle= "Log in";

        let welcome = `
            Log in!
        `;

        return res.render('moveout/login.ejs', {
            errors: [{ msg: 'Incorrect password!' }, ...errors.array()],
            pageTitle: pageTitle,
            welcome: welcome
        });
    }

    req.session.userId = userCredentials.id;
    // console.log(req.session);
    let pageTitle= `${name}'s Profile`;

    // let welcome = `
    //     ${name}'s Profile
    // `;

    res.render('moveout/profile.ejs', {
        pageTitle: pageTitle,
        // welcome: welcome
    });
});

router.get('/register',
    async (req, res) => {
    const errors = validationResult(req);

    let pageTitle= "register";
    let welcome = `
        Sign up
    `;

    res.render('moveout/index.ejs', {
        pageTitle: pageTitle,
        welcome: welcome
    });
});

router.post('/register',
    [
        // Validate fields using express-validator
        body('email')
            .isEmail().withMessage('Invalid email format')
            .normalizeEmail(),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters long')
            .matches(/^(?=.*[a-zA-Z])(?=.*[0-9])/)
            .withMessage('Password must contain both letters and numbers')
            .trim().escape(),
        body('username')
            .not().isEmpty().withMessage('Username is required')
            .trim().escape()
    ],
    async (req, res) => {
    const { username, email, password } = req.body;
    // console.log("req.body in register route", email, password, req.body);
    req.session.name = username;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        let pageTitle= "register";
        let welcome = `
            Sign up
        `;
      return res.render('moveout/index.ejs', { 
        errors: errors.array(),
        pageTitle: pageTitle,
        welcome: welcome
      });
    }
    const userCredentials = await moveOutUsers.getUserByEmail(email);

    if (userCredentials) {
        return res.status(401).render('moveout/login.ejs', {
            pageTitle: "Login",
            welcome: "log in!",
            errors: [{ msg: 'This account is already registered' }, ...errors.array()]
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        // console.log("hashedPassword", hashedPassword);

        const verificationToken = await crypto.randomBytes(32).toString('hex');
        // console.log(verificationToken);

        await moveOutUsers.createUser(email, hashedPassword, verificationToken, username);

        await utils.sendVerificationEmail(email, verificationToken);

    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Error registering user');
    }
    let pageTitle= "verify your account";
    let welcome = `
        You' ve registered successfully!
        To log in please verify your account:
        Check your inbox
        click the verification link.
    `;
    return res.render('moveout/verify.ejs', {
        pageTitle: pageTitle,
        welcome: welcome
    });
});

router.get('/verify', async (req, res) => {
    const tokenFromReq = req.query.token;

    try {
        const user = await moveOutUsers.verifyUserByToken(tokenFromReq);

        if (!user) {
            return res.status(400).send('Invalid or expired token.');
        }

        let pageTitle= "Log in";
        let welcome = `
            You' ve verified your account successfully!
            Log in!
        `;
        res.render('moveout/login.ejs', {
            pageTitle: pageTitle,
            welcome: welcome
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error.');
    }
});

router.get('/me', (req, res) => {
    let pageTitle = "Sup!";

    res.render("moveout/me.ejs", {
        pageTitle: pageTitle
    })
});

module.exports = router;
