const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/roleMiddleware");

const {
    createFeedback,
    getAllFeedback,
    getSingleFeedback,
    updateFeedback,
    deleteFeedback
} = require("../controllers/feedbackController");

// CREATE - faculty/admin only
router.post(
    "/create",
    verifyToken,
    authorizeRoles("faculty", "admin"),
    createFeedback
);


// GET ALL - logged-in users only
router.get(
    "/",
    verifyToken,
    getAllFeedback
);


// GET SINGLE - logged-in users only
router.get(
    "/:id",
    verifyToken,
    getSingleFeedback
);


// UPDATE - faculty/admin only
router.put(
    "/:id",
    verifyToken,
    authorizeRoles("faculty", "admin"),
    updateFeedback
);


// DELETE - admin only
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("admin"),
    deleteFeedback
);



module.exports = router;