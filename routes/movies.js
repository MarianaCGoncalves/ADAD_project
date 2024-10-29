import express from "express";
import db from "../db/config.js";

import { ObjectId } from "mongodb";
const router = express.Router();
// return first 50 documents from movies collection
router.get("/", async (req, res) => {
let results = await db.collection('movies').find({})
.limit(50)
.toArray();
res.send(results).status(200);
});

router.get("/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    let results = await db.collection('movies').find({_id: id})
    .limit(50)
    .toArray();
    res.send(results).status(200);
    });

export default router;
