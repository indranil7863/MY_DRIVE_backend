import express from "express";
import directoriesData from "../foldersDB.json" with { type: "json" };
import filesData from "../filesDB.json" with { type: "json" };
import { writeFile, rm } from "fs/promises";
import userData from "../userDB.json" with { type: "json" };

const router = express.Router();

router.get("/", (req, res) => {
  // if any id is not send from frontend-> i.e root directory
  const { uid } = req.cookies;
  const userdata = userData.find((user) => user.id === uid);

  const dirData = directoriesData.find(
    (dir) => dir.id === userdata.parentDirId,
  );
  // the user who is requesting for this folder, is it the same user who created it?
  if (dirData.userid !== uid) {
    return res
      .status(201)
      .json({ message: "You can't access this directory!" });
  }
  const directory = dirData.directories.map((dirid) => {
    const dirobj = directoriesData.find((dir) => dir.id === dirid);
    if (!dirobj) return null;
    return {
      id: dirobj.id,
      name: dirobj.name,
      parentDirid: dirobj.parentDir,
    };
  });
  const files = dirData.files.map((fileid) => {
    return filesData.find((files) => files.id === fileid);
  });
  return res.json({ ...dirData, files, directories: directory });
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { uid } = req.cookies;

  const dirData = directoriesData.find((dir) => dir.id === id);
  if (dirData.userid !== uid) {
    return res
      .status(201)
      .json({ message: "You can't access this directory!" });
  }
  const directory = dirData.directories.map((dirid) => {
    const dirobj = directoriesData.find((dir) => dir.id === dirid);
    if (!dirobj) return null;
    return {
      id: dirobj.id,
      name: dirobj.name,
      parentDirid: dirobj.parentDir,
    };
  });
  const files = dirData.files.map((fileid) => {
    return filesData.find((files) => files.id === fileid);
  });
  return res.json({ ...dirData, files, directories: directory });
});

router.post("/", async (req, res) => {
  const { uid } = req.cookies;
  const userdata = userData.find((user) => user.id === uid);
  const parentdirId =
    req.headers.parentdirid === "undefined"
      ? userdata.parentDirId
      : req.headers.parentdirid;

  const dirname =
    req.headers.dirname === "undefined" ? "New Folder" : req.headers.dirname;
  // check : requested user can create this folder
  const Dirobj = directoriesData.find((dir) => dir.id === parentdirId);
  if (Dirobj.userid !== uid) {
    return res.status(201).json({
      message: "You can't create this directory!",
      error: "Unauthorized access",
    });
  }
  const id = crypto.randomUUID();
  directoriesData.push({
    id,
    name: dirname,
    parentDir: parentdirId,
    userid: uid,
    files: [],
    directories: [],
  });

  const parentdir = directoriesData.find((dir) => dir.id === parentdirId);
  parentdir.directories.push(id);
  try {
    await writeFile("./foldersDB.json", JSON.stringify(directoriesData));
    return res.status(200).json({ message: "directory created" });
  } catch (error) {
    return res.json("error", "unable to create directory!");
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { uid } = req.cookies;
  const newdirname = req.body.newdirname;

  if (!newdirname) return res.json("success", true);
  const directoryRename = directoriesData.find((dir) => dir.id === id);
  // the person who is trying to change the name is the same person who created it?
  if (directoryRename.userid !== uid) {
    return res.status(201).json({ message: "You can't do this task!" });
  }
  directoryRename.name = newdirname;
  try {
    await writeFile("./foldersDB.json", JSON.stringify(directoriesData));
    return res.status(200).json({ message: "renamed" });
  } catch (error) {
    return res.json("error", "failed to rename");
  }
});

// async function deleteFolder(dirid) {
//   // find the folder from folderDB using dirid

//   const dirObj = directoriesData.find((dir) => dir.id === dirid);

//   const filesid = dirObj.files;
//   // delete all files inside it
//   for (let fileid of [...filesid]) {
//     // find the file
//     const filedata = filesData.find((file) => file.id === fileid);
//     // delete the actual file present with id.pdf
//     await rm(`./storage/${fileid}${filedata.extension}`, { force: true });
//     // delete the file from file array
//     filesData = filesData.filter((file) => file.id !== fileid);
//   }

//   const directoryidlist = dirObj.directories;
//   // iterate the directories list
//   for (let Dirid of [...directoryidlist]) {
//     // call deleteFolder for each dir
//     await deleteFolder(Dirid);
//   }
//   // delete that directory itself using dirid

//   directoriesData = directoriesData.filter((dir) => dir.id !== dirid);
// }

async function deleteFolder(dirid) {
  const dirObj = directoriesData.find((dir) => dir.id === dirid);
  if (!dirObj) return;

  for (let fileid of dirObj.files) {
    const filedata = filesData.find((file) => file.id === fileid);
    if (!filedata) continue;

    await rm(`./storage/${fileid}${filedata.extension}`, { force: true });

    const fileIndex = filesData.findIndex((file) => file.id === fileid);
    if (fileIndex !== -1) filesData.splice(fileIndex, 1);
  }

  for (let childDirId of [...dirObj.directories]) {
    await deleteFolder(childDirId);
  }

  const dirIndex = directoriesData.findIndex((dir) => dir.id === dirid);
  if (dirIndex !== -1) directoriesData.splice(dirIndex, 1);
}

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { uid } = req.cookies;

  try {
    const dirobj = directoriesData.find((dir) => dir.id === id);
    if (!dirobj) {
      return res.status(404).json({ error: "Directory not found" });
    }
    //check is the person trying to delete it same who created it?
    if (dirobj.userid !== uid) {
      return res.status(201).json({ error: "You can't delete it!" });
    }

    await deleteFolder(id);

    const parentDir = directoriesData.find(
      (dir) => dir.id === dirobj.parentDir,
    );

    if (parentDir) {
      const indxOfDir = parentDir.directories.findIndex((idx) => idx === id);
      if (indxOfDir !== -1) parentDir.directories.splice(indxOfDir, 1);
    }

    await writeFile("./foldersDB.json", JSON.stringify(directoriesData));
    await writeFile("./filesDB.json", JSON.stringify(filesData));

    res.status(200).json({ message: "directory deleted!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "unable to delete the directory!" });
  }
});

// router.delete("/:id", async (req, res) => {
//   const { id } = req.params;
//   // find that directory
//   const dirobj = directoriesData.find((dir) => dir.id === id);
//   const parentDir = directoriesData.find((dir) => dir.id === dirobj.parentDir);
//   const indxOfDir = parentDir.directories.findIndex((idx) => idx === id);
//   parentDir.directories.splice(indxOfDir, 1);
//   try {
//     await deleteFolder(id);
//     await writeFile("./foldersDB.json", JSON.stringify(directoriesData));
//     await writeFile("./filesDB.json", JSON.stringify(filesData));
//     res.status(200).json({ message: "directory deleted!" });
//   } catch (error) {
//     res.json({ error: "unable to delete the directory!" });
//   }
// });

export default router;
