// Import mongoose
import mongoose from 'mongoose';
// Create wishlist schema
const wishlistSchema = new mongoose.Schema({
    // User reference
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Products reference
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]

});
// Populate products before find queries
wishlistSchema.pre(/^find/, function () {
    this.populate('products');
});
// Create wishlist model
const Wishlist = mongoose.model('Wishlist', wishlistSchema);
// Export wishlist model
export default Wishlist;
