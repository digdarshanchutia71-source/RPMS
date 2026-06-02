const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER USER
exports.registerUser = async (req, res) => {

    try {

        const {
            full_name,
            email,
            password,
            role,
            department
        } = req.body;

        // CHECK EMPTY FIELDS
        if (!full_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All required fields must be filled"
            });
        }

        const normalizedRole =
            String(role || "student").toLowerCase();

        const allowedRoles = [
            "student",
            "faculty",
            "admin"
        ];

        if (!allowedRoles.includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user role"
            });
        }

        // CHECK EXISTING USER
        const checkUserQuery =
            "SELECT * FROM users WHERE email = ?";

        db.query(checkUserQuery, [email], async (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "User already exists"
                });
            }

            // HASH PASSWORD
            const hashedPassword =
                await bcrypt.hash(password, 10);

            // INSERT USER
            const insertQuery = `
                INSERT INTO users
                (full_name, email, password, role, department)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(
                insertQuery,
                [
                    full_name,
                    email,
                    hashedPassword,
                    normalizedRole,
                    department
                ],
                (err, data) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: "Registration Failed"
                        });
                    }

                    res.status(201).json({
                        success: true,
                        message: "User Registered Successfully"
                    });

                }
            );

        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};



// LOGIN USER
exports.loginUser = (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and Password required"
            });
        }

        const query =
            "SELECT * FROM users WHERE email = ?";

        db.query(query, [email], async (err, result) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (result.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid Email"
                });
            }

            const user = result[0];

            // CHECK PASSWORD
            const isMatch =
                await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid Password"
                });
            }

            // GENERATE TOKEN
            const token = jwt.sign(
                {
                    id: user.user_id,
                    role: user.role
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1d"
                }
            );

            res.status(200).json({
                success: true,
                message: "Login Successful",
                token,
                user: {
                    id: user.user_id,
                    full_name: user.full_name,
                    email: user.email,
                    role: user.role
                }
            });

        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }

};
