import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(404).json({ error: "all fields are required" });
    }
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(404).json({ error: "user already exist" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
    });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    return res.status(200).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    return res.status(404).json({ error: error });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(404).json({ error: "all fields are required" });
    }
    const doesUserExist = await User.findOne({ email });
    if (!doesUserExist) {
      return res.status(404).json({ error: "invalid credentials" });
    }
    const passwordMatched = await bcrypt.compare(
      password,
      doesUserExist.password,
    );
    if (!passwordMatched) {
      return res.status(404).json({ error: "invalid password" });
    }
    const token = jwt.sign(
      { userId: doesUserExist._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    return res.status(200).json({
      token,
      user: {
        id: doesUserExist._id,
        username: doesUserExist.username,
        email: doesUserExist.email,
      },
    });
  } catch (error) {
    return res.status(404).json({ error: error });
  }
};

export const forgotPassword = async(req, res) =>{
  try {
    const {email, newPassword} = req.body;
    if(!email || !newPassword) {
      return res.status(400).json({error: "invalid email"});
    }
    const user = await User.findOne({email:email});
    if(!user) {
      return res.status(400).json({error:"there is no user registered with the given email!!"})
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    return res.status(200).json({message:"password changed successfully", data:user});
    
  } catch (error) {
    res.status(400).json({error:error});
  }
}