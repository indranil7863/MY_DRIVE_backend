import express from "express";

import { createFile, deleteFile, updateFile, uploadInitiate, viewAndDownload } from "../controllers/fileControllers.js";

const router = express.Router();

router.post("/:filename", createFile);
router.patch("/:id", updateFile);
router.delete("/:id", deleteFile);
router.get("/:id", viewAndDownload);
router.post("/upload/initiate", uploadInitiate);



export default router;
