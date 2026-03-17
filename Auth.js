import userData from "./userDB.json" with { type: "json" };

export default function CheckAuth(req, res, next) {
  const { uid } = req.cookies;
  const userdata = userData.find((user) => user.id === uid);
  if (!uid || !userdata) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user = userdata;
  next();
}
