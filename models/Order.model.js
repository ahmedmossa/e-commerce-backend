import mongoose from "mongoose";
export const OrderStatuses = ["pending","confirmed","processing","shipped","delivered","cancelled","returned"];
export const PaymentMethods = ["cash","stripe","paypal","paymob"];
export const PaymentStatuses = ["pending","paid","failed","refunded"];
 
export const AllowedStatusTransitions = {
    pending: ["confirmed","cancelled"],
    confirmed: ["processing","cancelled"],
    processing: ["shipped","cancelled"],
    shipped: ["delivered","returned"],
    delivered: ["returned"],
    cancelled: [],
    returned: []
};

const orderItemSchema = new mongoose.Schema({
    product: {type: mongoose.Schema.Types.ObjectId,ref: "Product",required: true},
    name: {type: String,required: true},
    image: {type: String,default: ""},
    price: {type: Number,required: true,min: 0},
    quantity: {type: Number,required: true,min: 1,validate: {validator: Number.isInteger,message: "Quantity must be an integer"}}
},{_id: false});

const shippingAddressSchema = new mongoose.Schema({
    fullName: {type: String,required: true,trim: true},
    phone: {type: String,required: true,trim: true},
    country: {type: String,required: true,trim: true},
    city: {type: String,required: true,trim: true},
    address: {type: String,required: true,trim: true},
    postalCode: {type: String,required: true,trim: true}
},{_id: false});

const orderSchema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId,ref: "User",required: true},
    items: {type: [orderItemSchema],required: true,validate: {validator: items => Array.isArray(items) && items.length > 0,message: "Order must contain at least one item"}},
    shippingAddress: {type: shippingAddressSchema,required: true},
    paymentMethod: {type: String,enum: PaymentMethods,default: "cash"},
    paymentStatus: {type: String,enum: PaymentStatuses,default: "pending"},
    transactionId: {type: String,default: null},
    subtotal: {type: Number,required: true,min: 0},
    shippingFee: {type: Number,default: 0,min: 0},
    tax: {type: Number,default: 0,min: 0},
    discount: {type: Number,default: 0,min: 0},
    totalPrice: {type: Number,required: true,min: 0},
    status: {type: String,enum: OrderStatuses,default: "pending"},
    paidAt: {type: Date,default: null},
    deliveredAt: {type: Date,default: null},
    cancelledAt: {type: Date,default: null},
    customerNote: {type: String,default: "",trim: true,maxlength: 1000},
    adminNote: {type: String,default: "",trim: true,maxlength: 1000}
},{timestamps: true});

orderSchema.pre("validate",function(next){
    const subtotal = Number(this.subtotal);
    const shippingFee = Number(this.shippingFee);
    const tax = Number(this.tax);
    const discount = Number(this.discount);
    const totalPrice = Number(this.totalPrice);
    if (![subtotal,shippingFee,tax,discount,totalPrice].every(Number.isFinite)) {
        return next(new Error("Order prices must be valid numbers"));
    }
    if (discount < 0 || discount > subtotal) {
        return next(new Error("Discount cannot exceed subtotal"));
    }
    const expectedTotal = Number((subtotal + shippingFee + tax - discount).toFixed(2));
    if (Number(totalPrice.toFixed(2)) !== expectedTotal) {
        return next(new Error("Total price calculation is incorrect"));
    }
    if (this.paymentStatus === "paid" && !this.paidAt) {
        this.paidAt = new Date();
    }
    if (this.status === "delivered" && !this.deliveredAt) {
        this.deliveredAt = new Date();
    }
    if (this.status === "cancelled" && !this.cancelledAt) {
        this.cancelledAt = new Date();
    }
    next();
});

orderSchema.post("init",function(doc){
    doc.$locals.originalStatus = doc.status;
});

orderSchema.pre("save",function(next){
    if (!this.isNew && this.isModified("status")) {
        const previousStatus = this.$locals.originalStatus;
        if (!AllowedStatusTransitions[previousStatus]?.includes(this.status)) {
            return next(new Error(`Cannot change order status from ${previousStatus} to ${this.status}`));
        }
    }
    next();
});

orderSchema.post("save",function(doc){
    doc.$locals.originalStatus = doc.status;
});

const Order = mongoose.models.Order || mongoose.model("Order",orderSchema);
export default Order;
