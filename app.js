import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import paymentRoute from "./routes/paymentRoute.js"
import CheckAuth from "./Auth.js";
import { connectDB } from "./utils/db.js"
import dotenv from 'dotenv'
dotenv.config();

const port = process.env.PORT || 7000;
try {
  const db = await connectDB();

  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use(
    cors({
      // origin: "*",
      origin: process.env.FRONTEND_URL_DEV,
      credentials: true,
      allowedHeaders: ["Content-Type", "parentdirid", "dirname"],
    }),
  );

  app.use((req, res, next) => {
    req.db = db;
    next();
  })

  app.post("/hello-world", (req, res) => {
    console.log(req.body);
  })

  app.get("/", (req, res) => res.json("Hello, from server!"));
  app.use("/directory", CheckAuth, directoryRoutes);
  app.use("/files", CheckAuth, fileRoutes);
  app.use("/user", userRoutes);
  app.use("/payment", paymentRoute);

  app.listen(port, () => {
    console.log("Server is live! on port: ", port);
  });


} catch (error) {
  console.log(error);
}