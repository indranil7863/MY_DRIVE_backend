import express from "express";
import CheckAuth from "../Auth.js";
import { Db, ObjectId } from "mongodb";
const router = express.Router();

router.post("/register", async (req, res, next) => {
  const { name, email, password } = req.body;
  const db = req.db;
  const dirId = new ObjectId();
  const userId = new ObjectId();

  try {
  const userExist = await db.collection("users").findOne({email})
  if (userExist) {
    return res.status(209).json({ error: "email already exists!" });
  }

  const rootDirid = await db.collection("directories").insertOne({_id:dirId, userId, dirname:"root", parentDirId: null})

  const newuser = await db.collection("users").insertOne({_id:userId, parentDirId: dirId, username: name, email, password});

  if(rootDirid.acknowledged && newuser.acknowledged){
      return res.status(200).json("registration successful");
   }else{
      return res.status(201).json("unable to register");
   }
    
  } catch (error) {
    next(error);
    return res.status(201).json("unable to register");
  }
});

router.post("/signin", async(req, res) => {
  const { email, password } = req.body;
  const db = req.db;

  try {
     const userdata = await db.collection("users").findOne({email, password});
     if (!userdata) {
    return res.status(201).json({ message: "invalid Credentials!" });
  }
  console.log()
  res.cookie("uid", userdata._id.toString(), {
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });
  return res.status(200).json({ message: "successfully signin!" });
  } catch (error) {
    return res.status(201).json({message: "invalid Credentials!"});
  }
  
});

router.post("/logout", CheckAuth, (req, res) => {
  // res.cookie("uid", "", {
  //   maxAge: 0
  // })
  res.clearCookie("uid", {
    maxAge: 0,
  });
  res.status(200).json({ message: "logout successful!" });
});

router.get("/profile", CheckAuth, (req, res) => {

  res.status(200).json({ username: req.user.username, email: req.user.email });
});

export default router;
