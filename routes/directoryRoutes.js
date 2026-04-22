import express from "express";
import filesData from "../filesDB.json" with { type: "json" };
import { rm } from "fs/promises";
import {  ObjectId } from "mongodb";

const router = express.Router();

router.get("/", async (req, res) => {
  // if any id is not send from frontend-> i.e root directory
  const { uid } = req.cookies;
  const db = req.db;
 
 if(!req.user.parentDirId){
    return res.status(201).json({message: "directory doesn't exist"});
 } 

  const directoriesData = await db.collection("directories").find({parentDirId: req.user.parentDirId, userId: req.user._id }).toArray()
  // const filesData = await db.collection("files").find({parentDirId: req.user.parentDirId, userId: req.user._id }).toArray();
  const filedData = null;
  return res.json({ files: filesData, directories: directoriesData});
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { uid } = req.cookies;
  const db = req.db;

  const dirData = await db.collection("directories").findOne({_id: new ObjectId(id)})

  if(dirData.userId.toString() !== uid ){
      return res.status(201).json({"message": "You can't access this directory!"});
  }
   const directoriesData = await db.collection("directories").find({parentDirId: req.user.parentDirId, userId: req.user._id }).toArray()
   const filesData = await db.collection("files").find({parentDirId: req.user.parentDirId, userId: req.user._id }).toArray();
 
  return res.json({  files:filesData, directories: directoriesData });
});

router.post("/", async (req, res) => {
  const { uid } = req.cookies;
  const db = req.db;

  const parentdirId =
    req.headers.parentdirid === "undefined"
      ? req.user.parentDirId
      : req.headers.parentdirid;

  const dirname =
    req.headers.dirname === "undefined" ? "New Folder" : req.headers.dirname;

 
  try {
      // check : requested user can create this folder
  const dirData = await db.collection("directories").findOne({_id: new ObjectId(parentdirId)})
  if(dirData.userId.toString() !== uid ){
      return res.status(201).json({"message": "You can't create this directory!", error: "Unauthorized access!"});
  }

  const newDir = await db.collection("directories").insertOne({_id: new ObjectId(), dirname, parentDirId: new ObjectId(parentdirId) , userId: req.user._id})

    if(newDir.acknowledged){
       return res.status(200).json({ message: "directory created successfully!" });
    }else{
      return res.json("error", "unable to create directory!");
    }
   
  } catch (error) {
    return res.json("error", "unable to create directory!");
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { uid } = req.cookies;
  const db = req.db;
  const newdirname = req.body.newdirname;

  if (!newdirname) return res.json("success", true);
  
  try {
    const dirData = await db.collection("directories").findOne({_id: new ObjectId(id)})

  if(dirData.userId.toString() !== uid ){
      return res.status(201).json({"message": "You can't perform this operation!"});
  }
 
  const renameDir = await db.collection("directories").updateOne({_id: new ObjectId(id)}, {$set: {dirname:newdirname}})
  console.log("rename: ", renameDir)
    if(renameDir.modifiedCount){
      return res.status(200).json({ message: "renamed successfully!" });
    }else{
       return res.json("error", "failed to rename");
    }
    
  } catch (error) {
    return res.json("error", "failed to rename");
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  // const { uid } = req.cookies;
  const db = req.db;
  const filesCollection = db.collection("files")
  const directoryCollection = db.collection("directories")
  const dirObjId = new ObjectId(id)

  const directoryData = await directoryCollection.findOne({_id: dirObjId, userId: req.user._id}, {projection: {_id: 1}})
  if(!directoryData){
    return res.status(404).json({message: "directory not found!"});
  }

  async function getDirectoryContents(id){
    let files = await filesCollection.find({parentDirId: id }, {projection: {extension: 1}} ).toArray();
    let directories = await directoryCollection.find({parentDirId: id}, {projection: {_id: 1}}).toArray();
    for(const {_id} of directories){
      const {files: childFiles, directories: childDirectories} = await getDirectoryContents(new ObjectId(_id))
      files = [...files, ...childFiles]
      directories = [...directories, ...childDirectories];
    }
    return {files, directories};
  }

  const {files, directories} = await getDirectoryContents(dirObjId);
  
  for(const {_id, extension} of files){
    await rm(`./storage/${_id.toString()}${extension}`)
  }

  await filesCollection.deleteMany({_id: {$in: files.map(({_id})=> _id)}})

  await directoryCollection.deleteMany({_id: {$in: [...directories.map(({_id})=> _id), dirObjId]}})

  return res.json({message: "Directory deleted successfully!"});

});



export default router;
