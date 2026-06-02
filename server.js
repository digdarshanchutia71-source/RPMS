const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

require("./config/db");


// IMPORT ROUTES
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const milestoneRoutes = require("./routes/milestoneRoutes");
const fundingRoutes = require("./routes/fundingRoutes");
const documentRoutes = require("./routes/documentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const adminRoutes = require("./routes/adminRoutes");

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));





// AUTH ROUTES
app.use("/api/auth", authRoutes);

// PROJECT ROUTES
app.use("/api/projects", projectRoutes);

// MILESTONE ROUTES
app.use("/api/milestones", milestoneRoutes);

// FUNDING ROUTES
app.use("/api/funding", fundingRoutes);

// DOCUMENT ROUTES
app.use("/api/documents", documentRoutes);



// DASHBOARD ROUTES
app.use("/api/dashboard", dashboardRoutes);

// FEEDBACK ROUTES
app.use("/api/feedback", feedbackRoutes);

// ADMIN ROUTES
app.use("/api/admin", adminRoutes);

// DEFAULT ROUTE
app.get("/", (req, res) => {
    res.send("Research Project Management System API Running");
});


const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});