import { ObjectId } from "mongodb";

export default async function CheckAuth(req, res, next) {
  const { uid } = req.cookies;
  const db = req.db;
  if(!uid){
    return res.status(401).json({message: "Unauthorized"});
  }

  try {
     const userdata = await db.collection("users").findOne({_id: new ObjectId(uid)}, {projection: {password: 0}});

  if (!userdata) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = userdata;
  next();
  } catch (error) {
    console.log("error: ", error);
    return res.status(401).json({message: "Internval server error"});
  }
 
}
