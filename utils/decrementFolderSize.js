import { ObjectId } from "mongodb";
export async function decrementFolderSize(db, filesize, parentDirid){
     while(parentDirid){
        const dirdata = await db.collection('directories').findOne({ _id: new ObjectId(parentDirid)})
        await db.collection('directories').updateOne({ _id: new ObjectId(parentDirid) },{ $inc: {TotalDirectorySize: -filesize} } )
        parentDirid = dirdata.parentDirId
    }
}