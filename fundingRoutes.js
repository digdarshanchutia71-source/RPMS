const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createFunding,
    getAllFunding,
    getSingleFunding,
    updateFunding,
    deleteFunding
} = require("../controllers/fundingController");



// CREATE - admin only
router.post(
    "/create",
    verifyToken,
    authorizeRoles("admin"),
    createFunding
);

// GET ALL - logged-in users only
router.get(
    "/",
    verifyToken,
    getAllFunding
);

// GET SINGLE - logged-in users only
router.get(
    "/:id",
    verifyToken,
    getSingleFunding
);

// UPDATE - admin only
router.put(
    "/:id",
    verifyToken,
    authorizeRoles("admin"),
    updateFunding
);

// DELETE - admin only
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("admin"),
    deleteFunding
);


module.exports = router;