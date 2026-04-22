import { MongoClient } from "mongodb";

const client = new MongoClient("mongodb://localhost:27017/User")

export async function connectDB(){
    await client.connect();
    const db = client.db();
    console.log("Database Connected!")
    return db;
}

process.on("SIGINT", ()=>{
    client.close();
    console.log("Database Disconnected!")
    process.exit(0);
})