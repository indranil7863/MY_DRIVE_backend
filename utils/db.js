import { MongoClient } from "mongodb";
import dotenv from 'dotenv'
dotenv.config();

const db_url = process.env.DATABASE_URL;
const client = new MongoClient(db_url);

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