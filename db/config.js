import { MongoClient } from "mongodb";
const connectionString = "mongodb+srv://user:PASSWORD@cluster0.b6qpg.mongodb.net/";
const client = new MongoClient(connectionString);
let conn;
try {
conn = await client.connect();
} catch(e) {
console.error(e);
}
// Database name
let db = conn.db("Projeto");
export default db;