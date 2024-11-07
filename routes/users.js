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



//endpoint 6
router.get("/:id", async (req, res) => {
    try{
    const id = parseInt(req.params.id);
    let results = await db.collection('users').aggregate([
        {$match: {_id: id}},

       
        {$unwind: "$reviews"},
        
        {$sort: {"reviews.score": -1}},
        {$limit: 3},
        {$group: {
            _id: "$_id",
            first_name: {$first: "$first_name"},
            last_name: {$first: "$last_name"},
            year_of_birth: {$first: "$year_of_birth"},
            job: {$first: "$job"},
            reviews: {$push: "$reviews"}
        }}
        
     ])
    .toArray();
    if (!results || results.length == 0) { 
        res.status(404).send("User not found");
     } else { 
        res.status(200).send(results); }

     }catch (error) {
        res.send({'error':'Internal error'}).status(500);
     }
    }); 


    //endpoint 8
    router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        let results = await db.collection('users').deleteOne({_id: id});

        if (!results || results.length == 0) { 
          res.status(404).send("User not found");
       } else { 
          res.status(200).send(results); }

       }catch (error){
        res.send({'error':'Internal error'}).status(500);
       }
      });
      
export default router;
