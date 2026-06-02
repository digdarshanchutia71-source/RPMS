const express = require("express");

const router = express.Router();

const verifyToken = require("../middleware/verifyToken");
const authorizeRoles = require("../middleware/roleMiddleware");


const {
    createMilestone,
    getAllMilestones,
    getSingleMilestone,
    updateMilestone,
    deleteMilestone
} = require("../controllers/milestoneController");

// CREATE - admin/faculty only
router.post(
    "/create",
    verifyToken,
    authorizeRoles("admin", "faculty"),
    createMilestone
);

// GET ALL - logged-in users only
router.get(
    "/",
    verifyToken,
    getAllMilestones
);

// GET SINGLE - logged-in users only
router.get(
    "/:id",
    verifyToken,
    getSingleMilestone
);

// UPDATE - admin/faculty only
router.put(
    "/:id",
    verifyToken,
    authorizeRoles("admin", "faculty"),
    updateMilestone
);

// DELETE - admin only
router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("admin"),
    deleteMilestone
);



module.exports = router;