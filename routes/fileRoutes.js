import express from "express";
import filesData from "../filesDB.json" with { type: "json" };
import mime from "mime-types";
import { createFile, deleteFile, updateFile } from "../controllers/fileControllers.js";

const router = express.Router();

router.post("/:filename", createFile);
router.patch("/:id", updateFile);
router.delete("/:id", deleteFile);

router.get("/:id", (req, res) => {
  const { id } = req.params;
  const fileData = filesData.find((file) => file.id === id);
  if (req.query.action === "download") {
    res.set("Content-Disposition", "attachment");
  }
  const filetype = mime.lookup(fileData.name);
  res.set("Content-Type", filetype);
  res.sendFile(`${process.cwd()}/storage/${id}${fileData.extension}`, (err) => {
    if (err) {
      res.json({ error: "File not found" });
    }
  });
});



export default router;
