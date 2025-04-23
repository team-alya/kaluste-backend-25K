import mongoose from "mongoose";

const { Schema } = mongoose;
// This schema defines the structure of the image data
// The image data is stored in a MongoDB database using Mongoose
const imageSchema = new Schema({
  contentType: { type: String, required: true },
  image: { type: Buffer, required: true },
});

imageSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const tempImage = mongoose.model("tempImage", imageSchema);
export default tempImage;
