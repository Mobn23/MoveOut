const express = require("express");

const router = express.Router();

const utils = require("../src/utils");

const moveOutAdmin = require("../src/moveout-admin");





router.post('/delete-user/:userId', async (req, res) => {
    const userId = req.params.userId;

    // console.log("userId", userId);
    await moveOutAdmin.deleteUser(userId);
    res.redirect("/users");
});

router.post('/make-admin/:userId', async (req, res) => {
    const userId = req.params.userId;

    // console.log("userId", userId);
    await moveOutAdmin.makeUserAdminById(userId);
    res.redirect("/users");
});

router.get('/content', async (req, res) => {
    const allContent = await moveOutAdmin.displayAllContent();

    const pageTitle = "Boxes content";

    // console.log("allContent", allContent);
    res.render("moveout/admin-role/display-all-content.ejs", {
        pageTitle: pageTitle,
        allContent: allContent
    });
});

router.get('/categories', async (req, res) => {
    const allCategories = await moveOutAdmin.displayAllCategories();

    const pageTitle = "Boxes content categories";

    // console.log("allCategories", allCategories);
    res.render("moveout/admin-role/display-all-categories.ejs", {
        pageTitle: pageTitle,
        allCategories: allCategories
    });
});

router.get('/labels', async (req, res) => {
    const allLabels = await moveOutAdmin.displayAllLabels();

    const pageTitle = "Users Labels";

    // console.log("allLabels", allLabels);
    res.render("moveout/admin-role/display-all-labels.ejs", {
        pageTitle: pageTitle,
        allLabels: allLabels
    });
});

router.get('/users', async (req, res) => {
    const allUsers = await moveOutAdmin.displayAllUsers();

    const pageTitle = "Users data";

    // console.log("allUsers", allUsers);
    res.render("moveout/admin-role/display-all-users.ejs", {
        pageTitle: pageTitle,
        allUsers: allUsers
    });
});

router.get('/', async (req, res) => {
    const logsData = await moveOutAdmin.displayActivityLogs();

    const pageTitle = "Recent activity logs";

    // console.log("logsData", logsData);
    res.render("moveout/admin-role/admin-dashboard.ejs", {
        pageTitle: pageTitle,
        logsData: logsData
    });
});

module.exports = router;
