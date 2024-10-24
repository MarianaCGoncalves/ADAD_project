import { MongoClient } from "mongodb";
const connectionString = "mongodb+srv://mari:ADAD_bd1@clusteradad.xdolu.mongodb.net/";
const client = new MongoClient(connectionString);
let conn;
try {
conn = await client.connect();
} catch(e) {
console.error(e);
}
// Database name
let db = conn.db("ADAD_bd");
export default db;