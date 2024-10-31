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

router.get("/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    let results = await db.collection('users').aggregate([
        {$match: {_id: id}},
        {$unwind: "$reviews"},
         {$sort: {score: -1}},
        {$limit: 3}
     ])
    .toArray();
    if (!results || results.length === 0) { 
        res.status(404).send("User not found");
     } else { 
        res.status(200).send(results); }
    });

export default router;
