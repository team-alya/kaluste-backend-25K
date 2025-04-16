import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;
// TypeScript interface for the user document
export interface UserDocument extends Document {
  username: string;
  password: string;
  email: string;
  firstname: string;
  lastname: string;
  role: string;
  comparePassword(password: string): Promise<boolean>;
}
// This schema defines the structure of the user data
// The user data is stored in a MongoDB database using Mongoose
const userSchema = new Schema<UserDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin", "expert"], // voi lisätä muu rooli
    default: "user",
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

userSchema.set("toJSON", {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    },
});

const User = mongoose.model("User", userSchema);
export default User;
