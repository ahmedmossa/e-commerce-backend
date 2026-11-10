import jwt from "jsonwebtoken"
import User from "../models/User.model.js"

const Auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization token is required'
            });
        }

        const token = authHeader.replace('Bearer ',"")
        
        const decode = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findOne({ tokens: token, _id: decode._id })
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        req.token = token
        req.user = user
        next()
    } catch (error) {
        res.status(401).send({
            success: false,
            message: 'Require Auth'
        });
    }
}

export default Auth