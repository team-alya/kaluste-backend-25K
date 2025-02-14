import mongoose from "mongoose";

const { Schema } = mongoose;

const imageSchema = new Schema({
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  image: { type: Buffer, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Image = mongoose.model("Image", imageSchema);
export default Image;