import jwt from 'jsonwebtoken'
import dotenv from "dotenv";
dotenv.config();

export const generateOtp = (email, name, password) =>{
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const token = jwt.sign({
        email,
        name,
        password,
        otp
    }, process.env.JWT_SECRET, {
        expiresIn: "1m"
    })

  return {otp, token};
}