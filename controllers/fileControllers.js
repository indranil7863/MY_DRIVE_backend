import { ObjectId } from "mongodb";
import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";

export const createFile = async(req, res, next) => {
  const { filename } = req.params;
  const db = req.db;
  const { uid } = req.cookies;
  // const id = crypto.randomUUID();

  try {
  const userdata = await db.collection("users").findOne({_id: new ObjectId(uid)});

  const parentDirId =
    req.headers.parentdirid === "undefined"
      ? userdata.parentDirId
      : req.headers.parentdirid;
 
  const extension = path.extname(filename);
  const filedata = await db.collection("files").insertOne({
    parentDirId: new ObjectId(parentDirId),
    userId: userdata._id,
    fileName: filename,
    extension: extension
  })

  if(!filedata)return res.status(400).json({message: "Internal server error!"});
  console.log("filedata: ", filedata);

  const fullFileName = `${filedata.insertedId}${extension}`;
  const writeStream = createWriteStream(`./storage/${fullFileName}`);
  
  req.pipe(writeStream);
  req.on("end", async () => {
    console.log("end")

  if(filedata){
    return res.status(200).json({ message: "File Uploaded" });
  }
   return res.status(400).json({message: "Unable to store the file!"});

  })}
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
    const updatedfilename = await db.collection("files").findOneAndUpdate({_id: new ObjectId(id), userId: userdata._id}, {$set: {fileName:newFileName }})
  
    if(updatedfilename){
      return res.status(200).json({ message: "Renamed" });
    }
    return res.status(400).json({message: "unable to rename!"});
  } catch (error) {
    next(error)
    console.log("Error: ", error.message);
  }
  
}

export const deleteFile = async (req, res, next) => {
  const {id} = req.params;
  
  const userdata = req.user;
  const db = req.db;
  try {
    const filedata = await db.collection("files").findOne({_id: new ObjectId(id), userId: userdata._id});
    if(!filedata)return res.status(400).json({message: "unable to delete file!"});

    await rm(`./storage/${id}${filedata.extension}`);
    const deleteFile = await db.collection("files").deleteOne({_id: new ObjectId(id), userId: userdata._id});
    
    if(deleteFile){
      return res.status(200).json({ message: "File Deleted Successfully" });
    }
    
    return res.status(400).json({message: "Unable to delete file!"})
  } catch (error) {
    next(error);
    console.log("Error: ", error.message);
  }
}