import mongoose from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema({
  user_id: { 
            type: String, 
            required: true, 
            unique: true },
  username: { 
            type: String, 
            required: true, 
            unique: true },
  password: { 
            type: String, 
            required: true },
  gmail: { 
            type: String,
            required: true,
            unique: true },
  firstname: { 
            type: String, 
            required: true },
  lastname: { 
            type: String, 
            required: true },
  role: {
    type: String,
    enum: ["customer"], // voi lisätä muu rooli
    default: "customer",
  },
});

const User = mongoose.model("User", userSchema);
export default User;
