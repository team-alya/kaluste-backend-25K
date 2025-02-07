import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

interface UserDocument extends Document {
  username: string;
  password: string;
  email: string;
  firstname: string;
  lastname: string;
  role: "customer";
  comparePassword(password: string): Promise<boolean>;
}

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
    enum: ["customer"], // voi lisätä muu rooli
    default: "customer",
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

const User = mongoose.model("User", userSchema);
export default User;
