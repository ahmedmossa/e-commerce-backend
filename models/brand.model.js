import mongoose from "mongoose";
const brandSchema = new mongoose.Schema(
 {
    name: {
      type: String,
      required: true,
      trim: true,
      unique:true
    },

    description: {
      type: String,
      trim: true,
    },

    image: {
      url: {
        type: String,
        required: true,
        trim: true,
      },
      public_id: {
        type: String,
        required: true,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);
const Brand =mongoose.model("Brand",brandSchema);
export default Brand;