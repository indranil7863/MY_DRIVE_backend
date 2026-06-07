import { ObjectId } from "mongodb";
import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import mime from "mime-types";
import { createGetSignedUrl, createUploadSignedUrl, deletes3File } from "../utils/S3.js";
import { incrementFolderSize } from "../utils/incrementFolderSize.js";
import { decrementFolderSize } from "../utils/decrementFolderSize.js";

export const createFile = async (req, res, next) => {
  const { filename } = req.params;
  const db = req.db;
  const { uid } = req.cookies;
  // const id = crypto.randomUUID();

  try {
    const userdata = await db.collection("users").findOne({ _id: new ObjectId(uid) });

    const parentDirId =
      req.headers.parentdirid === "undefined"
        ? userdata.parentDirId
        : req.headers.parentdirid;

    const extension = path.extname(filename);
    const fileType = mime.lookup(filename)
    const filedata = await db.collection("files").insertOne({
      parentDirId: new ObjectId(parentDirId),
      userId: userdata._id,
      fileName: filename,
      extension: extension,
      fileType: fileType
    })

    if (!filedata) return res.status(400).json({ message: "Internal server error!" });
    console.log("filedata: ", filedata);

    const fullFileName = `${filedata.insertedId}${extension}`;
    const writeStream = createWriteStream(`./storage/${fullFileName}`);

    req.pipe(writeStream);
    req.on("end", async () => {
      console.log("end")

      if (filedata) {
        return res.status(200).json({ message: "File Uploaded" });
      }
      return res.status(400).json({ message: "Unable to store the file!" });

    })
  }
  catch (error) {
    next(error)
    console.log("Error: ", error.message);
  }
}

export const updateFile = async (req, res, next) => {
  const db = req.db;
  const { id } = req.params;
  const userdata = req.user;
  const newFileName = req.body.newfilename;

  try {
    const updatedfilename = await db.collection("files").findOneAndUpdate({ _id: new ObjectId(id), userId: userdata._id }, { $set: { fileName: newFileName } })

    if (updatedfilename) {
      return res.status(200).json({ message: "Renamed" });
    }
    return res.status(400).json({ message: "unable to rename!" });
  } catch (error) {
    next(error)
    console.log("Error: ", error.message);
  }

}

export const deleteFile = async (req, res, next) => {
  const { id } = req.params;

  const userdata = req.user;
  const db = req.db;
  try {
    const filedata = await db.collection("files").findOne({ _id: new ObjectId(id), userId: userdata._id });
    if (!filedata) return res.status(400).json({ message: "File doesn't exists!" });

    await deletes3File(`${filedata._id}${filedata.extension}`)

    const deleteFileRes = await db.collection("files").deleteOne({ _id: new ObjectId(id), userId: userdata._id });

    if (!deleteFileRes || deleteFileRes.deletedCount === 0) {
      return res.status(400).json({ message: "unable to Deleted file!" });
    }

    // if deleted file successful then decrement the parent folder size
    await decrementFolderSize(db, filedata.fileSize, filedata.parentDirId)
    return res.status(200).json({ message: "file deleted successfully!" })
  } catch (error) {
    next(error);
    console.log("Error: ", error.message);
  }
}

export const viewAndDownload = async (req, res, next) => {
  const { id } = req.params;
  const db = req.db;
  const userdata = req.user;

  try {
    const fileData = await db.collection("files").findOne({ _id: new ObjectId(id), userId: userdata._id })
  
    if (!fileData) return res.status(404).json({ error: "File not found!" })

    if (req.query.action === "download") {
      const fileUrl = await createGetSignedUrl({
        key: `${id}${fileData.extension}`,
        download: true,
        filename: fileData.fileName
      })
      return res.status(200).json({ url: fileUrl })
    }
    // for view 
    const fileUrl = await createGetSignedUrl({
      key: `${id}${fileData.extension}`,
      filename: fileData.fileName
    })

    return res.redirect(fileUrl);
  } catch (error) {
    next(error)
    console.log("Error: ", error.message);
  }

}

export const uploadInitiate = async (req, res, next) => {
  const { uid } = req.cookies;
  const db = req.db;
  const filename = req.body.name || "untitled";
  const filesize = req.body.size;
  const extension = path.extname(filename);
  const fileType = mime.lookup(filename);

  try {
    const userdata = await db.collection("users").findOne({ _id: new ObjectId(uid) });
    const parentDirId = req.body.parentDirId || userdata.parentDirId;

    const parentDirData = await db.collection("directories").findOne({ _id: new ObjectId(parentDirId), userId: new ObjectId(uid) })
    if (!parentDirData) {
      return res.status(404).json({ error: "parent Directory not found!" })
    }

    if (filesize > userdata.TotalUserStorage) {
      console.log("File size exceeded");
      return res.json("File size exceeded!")
    }
    await incrementFolderSize(db, parentDirId, filesize);

    // calculate space before save the file (pending..)

    const insertedFile = await db.collection("files").insertOne({
      parentDirId: new ObjectId(parentDirId),
      userId: userdata._id,
      fileName: filename,
      extension: extension,
      fileType: fileType,
      fileSize: filesize,
      isUploading: true
    })

    const uploadSignedUrl = await createUploadSignedUrl({
      Key: `${insertedFile.insertedId.toString()}${extension}`,
      contentType: req.body.contentType
    })

    res.status(200).json({ uploadSignedUrl, fileId: insertedFile._id });

  } catch (error) {
    next(error);
    console.log("Error: ", error.message);
  }
}