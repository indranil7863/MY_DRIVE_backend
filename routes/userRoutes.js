import express from "express";
import CheckAuth from "../Auth.js";
import { LogOut, Profile, Register, SignIn } from "../controllers/UserControllers.js";
const router = express.Router();

router.post("/register", Register);
router.post("/signin", SignIn);
router.post("/logout", CheckAuth, LogOut);
router.get("/profile", CheckAuth, Profile);

export default router;
