import express from "express";
import { createDirectory, deleteDirectory, getDirData, getParentDirData, renameDirectory } from "../controllers/DirectoryControllers.js";

const router = express.Router();

router.get("/", getParentDirData);

router.get("/:id", getDirData);

router.post("/", createDirectory);

router.patch("/:id", renameDirectory);

router.delete("/:id", deleteDirectory);



export default router;
