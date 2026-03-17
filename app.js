import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import directoryRoutes from "./routes/directoryRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import CheckAuth from "./Auth.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "parentdirid", "dirname"],
  }),
);

app.use("/directory", CheckAuth, directoryRoutes);
app.use("/files", CheckAuth, fileRoutes);
app.use("/user", userRoutes);

app.listen(4000, () => {
  console.log("Server is live!");
});
