import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        default:null,
    },
    avatar: {
        type: String,
        default: null,
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer',
    },
    addresses: [
        {
            country: {
                type: String,
            },
            city: {
                type: String,
            },
            street: {
                type: String,
            },
            building: {
                type: String
            },
            postalCode: {
                type: String,
            },
            defaultAddess: {
                type: Boolean
            }
        }
    ],
    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }
    ],
    isVerified: {
        type: Boolean,
        default: false
    },
    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpire: {
        type: Date,
        default: null
    },

    tokens: [{
        type: String
    }]
})

userSchema.pre('save', async function () {
    const user = this;
    if (user.isModified('password') && !this.$locals.passwordAlreadyHashed) {
        user.password = await bcryptjs.hash(user.password, 10)
    }
})

userSchema.methods.toJSON = function () {
    const userObj = this.toObject()
    delete userObj.password
    delete userObj.resetPasswordToken
    delete userObj.resetPasswordExpire
    delete userObj.tokens
    return userObj
}

const User = mongoose.model('User', userSchema)
export default User;

