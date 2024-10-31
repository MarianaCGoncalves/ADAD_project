import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
const router = express.Router();

router.delete("/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    let results = await db.collection('comments').deleteOne({_id: id});
    res.send(results).status(200);
    });

router.post("/", async (req,res)=> {
    let newComment = req.body;
    newComment.date = new Date();
    console.log(newComment);
    let results = await db.collection('comments').insertOne(newComment);
    res.send(results).status(200);
})
export default router;
