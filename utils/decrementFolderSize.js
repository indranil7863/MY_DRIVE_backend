import { ObjectId } from "mongodb";
export async function decrementFolderSize(db, filesize, parentDirid) {
    while (parentDirid) {
        const dirdata = await db.collection('directories').findOne({ _id: new ObjectId(parentDirid) })
        await db.collection('directories').updateOne({ _id: new ObjectId(parentDirid) }, { $inc: { TotalDirectorySize: -filesize } })
        parentDirid = dirdata.parentDirId
    }
}

export async function decrementDirectorySize(db, filesize, parentDirid) {
    console.log(db)
    console.log(filesize)
    console.log(parentDirid)
    while (parentDirid) {
        const dirdata = await db.collection('directories').findOne({ _id: new ObjectId(parentDirid) })
        console.log(dirdata);
        await db.collection('directories').updateOne({ _id: new ObjectId(parentDirid) }, { $inc: { TotalDirectorySize: -filesize } })
        parentDirid = dirdata.parentDirId
    }
}