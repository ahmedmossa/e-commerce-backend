export const adminOnly = (req, res, next) => {
    try {
        const user = req.user;

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You are not allowed to access this resource.'
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Internal server error.'
        });
    }
};