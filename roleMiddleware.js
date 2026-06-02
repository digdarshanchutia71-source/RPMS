const authorizeRoles = (...roles) => {

    return (req, res, next) => {

        // USER ROLE FROM JWT
        const userRole = String(req.user.role).toLowerCase();

        const allowedRoles =
            roles.map((role) => String(role).toLowerCase());

        // CHECK ROLE
        if (!allowedRoles.includes(userRole)) {

            return res.status(403).json({
                success: false,
                message: "Access Forbidden"
            });

        }

        next();

    };

};

module.exports = authorizeRoles;
