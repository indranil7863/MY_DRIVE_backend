
import { rm } from "fs/promises";
import { ObjectId } from "mongodb";
import { deletes3Files } from "../utils/S3.js";

const isValidMongoId = (id) => {
  const regex = /^[a-fA-F0-9]{24}$/;
  return typeof id === 'string' && regex.test(id);
};

export const getParentDirData = async (req, res) => {
  // if any id is not send from frontend-> i.e root directory
  const { uid } = req.cookies;
  const db = req.db;


  if (!req.user.parentDirId) {
    return res.status(201).json({ message: "directory doesn't exist" });
  }

  const directoriesData = await db.collection("directories").find({ parentDirId: req.user.parentDirId, userId: req.user._id }).toArray()
  const filesData = await db.collection("files").find({ parentDirId: req.user.parentDirId, userId: req.user._id }).toArray();

  return res.json({ files: filesData, directories: directoriesData });
}

export const getDirData = async (req, res) => {
  const { id } = req.params;
  const { uid } = req.cookies;
  const db = req.db;

  if (!isValidMongoId(id)) return res.status(400).json({ message: "id is invalid!" });

  const dirData = await db.collection("directories").findOne({ _id: new ObjectId(id) })

  if (dirData.userId.toString() !== uid) {
    return res.status(201).json({ "message": "You can't access this directory!" });
  }
  const directoriesData = await db.collection("directories").find({ parentDirId: new ObjectId(id), userId: req.user._id }).toArray()
  const filesData = await db.collection("files").find({ parentDirId: new ObjectId(id), userId: req.user._id }).toArray();

  return res.json({ files: filesData, directories: directoriesData });
}

export const createDirectory = async (req, res) => {
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
    const dirData = await db.collection("directories").findOne({ _id: new ObjectId(parentdirId) })
    if (dirData.userId.toString() !== uid) {
      return res.status(201).json({ "message": "You can't create this directory!", error: "Unauthorized access!" });
    }

    const newDir = await db.collection("directories").insertOne({ _id: new ObjectId(), dirname, parentDirId: new ObjectId(parentdirId), TotalDirectorySize: 0, userId: req.user._id })

    if (newDir.acknowledged) {
      return res.status(200).json({ message: "directory created successfully!" });
    } else {
      return res.json("error", "unable to create directory!");
    }

  } catch (error) {
    return res.json("error", "unable to create directory!");
  }
}

export const renameDirectory = async (req, res) => {
  const { id } = req.params;
  const { uid } = req.cookies;
  const db = req.db;
  const newdirname = req.body.newdirname;

  if (!isValidMongoId(id)) return res.status(400).json({ message: "id is invalid!" });

  if (!newdirname) return res.json("success", true);

  try {
    const dirData = await db.collection("directories").findOne({ _id: new ObjectId(id) })

    if (dirData.userId.toString() !== uid) {
      return res.status(201).json({ "message": "You can't perform this operation!" });
    }

    const renameDir = await db.collection("directories").updateOne({ _id: new ObjectId(id) }, { $set: { dirname: newdirname } })
    console.log("rename: ", renameDir)
    if (renameDir.modifiedCount) {
      return res.status(200).json({ message: "renamed successfully!" });
    } else {
      return res.json("error", "failed to rename");
    }

  } catch (error) {
    return res.json("error", "failed to rename");
  }
}

export const deleteDirectory = async (req, res) => {
  const { id } = req.params;
  // const { uid } = req.cookies;
  const db = req.db;
  const filesCollection = db.collection("files")
  const directoryCollection = db.collection("directories")
  const dirObjId = new ObjectId(id)

  if (!isValidMongoId(id)) return res.status(400).json({ message: "id is invalid!" });

  const directoryData = await directoryCollection.findOne({ _id: dirObjId, userId: req.user._id }, { projection: { _id: 1 } })
  if (!directoryData) {
    return res.status(404).json({ message: "directory not found!" });
  }

  async function getDirectoryContents(id) {
    let files = await filesCollection.find({ parentDirId: id }, { projection: { extension: 1 } }).toArray();
    let directories = await directoryCollection.find({ parentDirId: id }, { projection: { _id: 1 } }).toArray();
    for (const { _id } of directories) {
      const { files: childFiles, directories: childDirectories } = await getDirectoryContents(new ObjectId(_id))
      files = [...files, ...childFiles]
      directories = [...directories, ...childDirectories];
    }
    return { files, directories };
  }

  const { files, directories } = await getDirectoryContents(dirObjId);

  if (files.length) {
    const keys = files.map(({ _id, extension }) => ({ Key: `${_id}${extension}` }));
    await deletes3Files(keys);

    await filesCollection.deleteMany({ _id: { $in: files.map(({ _id }) => _id) } })
  }

  await directoryCollection.deleteMany({ _id: { $in: [...directories.map(({ _id }) => _id), dirObjId] } })

  return res.json({ message: "Directory deleted successfully!" });

}

export const getBreadCrumbData = async (req, res, next) => {
  const { id } = req.params;
  const result = [];
  const db = req.db;
  const isvalidid = isValidMongoId(id);

  if (!id || !isvalidid) return res.status(400).json({ message: "Not a valid dirid!" });
  try {

    async function fetchdata(parentdirid) {
      const dirdata = await db.collection("directories").findOne({ _id: new ObjectId(parentdirid) })
      if (dirdata) {
        result.push(dirdata.dirname);
      }

      if (dirdata && dirdata.parentDirId !== null) {
        await fetchdata(dirdata.parentDirId);
      }
    }

    await fetchdata(id);
    result.reverse();
    return res.status(200).json({ result });

  } catch (error) {
    next(error);
    console.log("Error: ", error.message);
  }
}
