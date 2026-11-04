import jwt from "jsonwebtoken"
import User from "../models/User.model.js"

const Auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', "")
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