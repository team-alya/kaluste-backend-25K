import mongoose from "mongoose";

const { Schema } = mongoose;

const image = new Schema({
  contentType: { type: String, required: true },
  image: { type: Buffer, required: true },
  timeStamp: { type: Date, default: Date.now },
});

image.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Image = mongoose.model("Image", image);
export default Image;
