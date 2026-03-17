import express from "express";
import { createWriteStream } from "fs";
import { rename, rm, writeFile } from "fs/promises";
import path from "path";
import filesData from "../filesDB.json" with { type: "json" };
import directoriesData from "../foldersDB.json" with { type: "json" };
import userData from "../userDB.json" with { type: "json" };
import mime from "mime-types";
const router = express.Router();

// create
router.post("/:filename", (req, res) => {
  const { filename } = req.params;
  // if parentdirid is undefined
  const { uid } = req.cookies;
  const userdata = userData.find((user) => user.id === uid);

  const id = crypto.randomUUID();
  console.log(req.headers);
  const parentDirId =
    req.headers.parentdirid === "undefined"
      ? userdata.parentDirId
      : req.headers.parentdirid;
  console.log("parentdirid: ", req.headers.parentdirid);
  const extension = path.extname(filename);
  const fullFileName = `${id}${extension}`;
  const writeStream = createWriteStream(`./storage/${fullFileName}`);

  req.pipe(writeStream);
  req.on("end", async () => {
    filesData.push({
      id,
      extension,
      name: filename,
      parentDirId,
    });
    const parentDirData = directoriesData.find(
      (dirData) => dirData.id === parentDirId,
    );
    parentDirData.files.push(id);
    await writeFile("./foldersDB.json", JSON.stringify(directoriesData));
    await writeFile("./filesDB.json", JSON.stringify(filesData));
    res.json({ message: "File Uploaded" });
  });
});

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

// Update
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const item = filesData.find((file) => file.id === id);
  const newFileName = req.body.newfilename;
  item.name = newFileName;
  await writeFile("./filesDB.json", JSON.stringify(filesData));
  res.status(200).json({ message: "Renamed" });
});

// Delete
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const fileIndx = filesData.findIndex((file) => file.id === id);
  const filedata = filesData[fileIndx];
  try {
    await rm(`./storage/${id}${filedata.extension}`);
    filesData.splice(fileIndx, 1);
    await writeFile("./filesDB.json", JSON.stringify(filesData));
    const parentDirData = directoriesData.find(
      (dirdata) => dirdata.id === filedata.parentDirId,
    );
    parentDirData.files = parentDirData.files.filter((fileId) => fileId != id);
    await writeFile("./foldersDB.json", JSON.stringify(directoriesData));
    res.json({ message: "File Deleted Successfully" });
  } catch (error) {
    res.status(404).json({ message: err.message });
  }
});

export default router;
