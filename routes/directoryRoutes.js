import express from "express";
import { createDirectory, deleteDirectory, getBreadCrumbData, getDirData, getParentDirData, renameDirectory } from "../controllers/DirectoryControllers.js";

const router = express.Router();

router.get("/", getParentDirData);
router.get("/:id", getDirData);
router.post("/", createDirectory);
router.patch("/:id", renameDirectory);
router.delete("/:id", deleteDirectory);
router.get("/breadcrumb/:id", getBreadCrumbData);



export default router;
