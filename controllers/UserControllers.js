
import { ObjectId } from "mongodb";
import { generateOtp } from "../utils/generateOtp.js";
import { sendEmail } from "../utils/sendEmail.js";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv';
dotenv.config();


export const Register = async (req, res, next) => {
  const { name, email, password } = req.body;
  const db = req.db;

  try {
    const userExist = await db.collection("users").findOne({ email: email })

    if (userExist) {
      return res.status(209).json({ error: "email already exists!" });
    }

    // generate otp
    const { otp, token } = generateOtp(email, name, password);
    // send otp
    const isEmailSent = sendEmail(email, otp);

    if (!isEmailSent) {
      throw new Error("Unable to send Email!");
    }
    //send token
    res.cookie("token", token, {
      sameSite: "none",
      httpOnly: true,
      secure: true
    })

    res.status(200).json({ message: "Otp send successfully!" });

  } catch (error) {
    next(error);
    console.log("Error: ", error.message);
  }
}

export const verifyOtp = async (req, res, next) => {
  const { token } = req.cookies;
  const { otp } = req.body;
  const db = req.db;
  const dirId = new ObjectId();
  const userId = new ObjectId();

  try {
    const expired = jwt.verify(token, process.env.JWT_SECRET);
    if (expired.otp !== otp) {
      return res.status(400).json({ message: "Otp expired!" });
    }

    const { name, email, password } = expired;

    const rootDirid = await db.collection("directories").insertOne({ _id: dirId, userId, dirname: "root", TotalDirectorySize: 0, parentDirId: null })
    const newuser = await db.collection("users").insertOne({ _id: userId, parentDirId: dirId, TotalUserStorage: 2 * 1024 * 1024 * 1024, username: name, email, password });

    if (rootDirid.acknowledged && newuser.acknowledged) {
      return res.status(200).json("registration successful");
    } else {
      return res.status(201).json("unable to register");
    }

  } catch (error) {
    next(error);
    console.log("Error: ", error.message);
  }

}

export const SignIn = async (req, res, next) => {
  const { email, password } = req.body;
  const db = req.db;

  try {
    const userdata = await db.collection("users").findOne({ email, password });
    if (!userdata) {
      return res.status(201).json({ message: "invalid Credentials!" });
    }

    res.cookie("uid", userdata._id.toString(), {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });
    return res.status(200).json({ message: "successfully signin!" });
  } catch (error) {
    next(error);
    console.log("Error: ", error.message);
  }

}

export const LogOut = (req, res) => {
  // res.cookie("uid", "", {
  //   maxAge: 0
  // })
  res.clearCookie("uid", {
    maxAge: 0,
  });
  res.status(200).json({ message: "logout successful!" });
}

export const Profile = async (req, res) => {
  const db = req.db;

  const userData = await db.collection("users").findOne({ email: req.user.email }, { projection: { password: 0 } });
  // console.log(userData);
  const rootDirData = await db.collection("directories").findOne({ _id: userData.parentDirId });
  // console.log(rootDirData);
  
  res.status(200).json({ ...userData, TotalDirectorySize: rootDirData.TotalDirectorySize });
}