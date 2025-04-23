import mongoose from "mongoose";

const { Schema } = mongoose;
// This schema defines the structure of the location data
// The location data is stored in a MongoDB database using Mongoose
const locationSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: false,
    default: "Recycling center",
  },
  gps_coordinates: {
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

locationSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Location = mongoose.model("Location", locationSchema);
export default Location;