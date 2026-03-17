import express from "express";
import userData from "../userDB.json" with { type: "json" };
import directoryDB from "../foldersDB.json" with { type: "json" };
import fs, { writeFile } from "fs/promises";
import CheckAuth from "../Auth.js";
const router = express.Router();

router.post("/register", async (req, res, next) => {
  const { name, email, password } = req.body;
  const userExist = userData.find((user) => user.email === email);
  if (userExist) {
    return res.status(209).json({ error: "email already exists!" });
  }
  const dirId = crypto.randomUUID();
  const userId = crypto.randomUUID();
  // create user and it's corresponding parentDirectroy
  directoryDB.push({
    id: dirId,
    userid: userId,
    name: "root",
    parentDir: null,
    files: [],
    directories: [],
  });

  userData.push({
    id: userId,
    parentDirId: dirId,
    username: name,
    email,
    password,
  });

  try {
    await writeFile("./foldersDB.json", JSON.stringify(directoryDB));
    await writeFile("./userDB.json", JSON.stringify(userData));
    return res.status(200).json("registration successful");
  } catch (error) {
    next(error);
    return res.status(201).json("unable to register");
  }
});

router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  const userdata = userData.find((user) => user.email === email);

  if (!userdata || userdata.password !== password) {
    return res.status(201).json({ message: "invalid Credentials!" });
  }
  res.cookie("uid", userdata.id, {
    sameSite: "none",
    secure: true,
    httpOnly: true,
  });
  return res.status(200).json({ message: "successfully signin!" });
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
  // const userdata = req.user;
  res.status(200).json({ username: req.user.username });
});

export default router;
