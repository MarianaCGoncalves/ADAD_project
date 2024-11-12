import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
const router = express.Router();

//endpoint 19
router.delete("/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    try{
        let results = await db.collection('comments').deleteOne({_id: id});
        res.send(results).status(200);

        if(!results){
            res.status(400).send("No comment found");
        }else{
            res.status(200).send(results);
        }
    }catch(error){
        res.send({"error":"Internal Error"}).status(500);
    }
    });

//endpoint 18
router.post("/", async (req,res)=> {
    try{
        let newComment = req.body;
        newComment.date = new Date();
        //console.log(newComment);
        let results = await db.collection('comments').insertOne(newComment);
        if(!results){
            res.send({"error":"Couldn't post that comment"});
        }else{
            res.send(results).status(200);
        }
    }catch(error){
        res.send({"error":"Internal Error"}).status(500);
    }
})
export default router;
