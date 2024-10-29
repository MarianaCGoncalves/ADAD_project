import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
const router = express.Router();

router.get("/", async (req, res) => { 
    let results = await db.collection('users').find({})
    .limit(10).skip(10)
    .toArray();
    res.send(results).status(200);
});

export default router;
