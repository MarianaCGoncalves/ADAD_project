import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
const router = express.Router();

//EXEMPLO DE PAGINAÇÃO
/*router.get("/page/:page", async (req, res) => { 
    let page = parseInt(req.params.page) * 10;
    let results = await db.collection('users').find({})
    .limit(10).skip(page)
    .toArray();
    res.send(results).status(200);
});
*/
//Endpoint 2 (Ricardo) Listar Users com paginação

router.get('/', async (req, res) => {
   const page = parseInt(req.query.page) || 1; 
   const limit = parseInt(req.query.limit) || 10;

try{
   const users = (await db.collection('users').find().skip((page-1)*limit).limit(limit).toArray());
   res.status(200).json({ page, limit,users });}
        
catch (error) {
   res.status(500).json({ message: "Erro" });
 }



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
     } 
        res.status(200).send(results); 

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
       }  
          res.status(200).send(results); 

       }catch (error){
        res.send({'error':'Internal error'}).status(500);
       }
      });


      //endpoint 10
      router.put('/:id', async (req, res) => {
         try {
         const id = parseInt(req.params.id);
         const {first_name,
             last_name,
             year_of_birth,
             job,
             reviews } = req.body; //o rec.body contem os dados do corpo pedido no http
     
         let results = await db.collection('users').updateOne(
             {_id: id},
             {$set: {first_name,
               last_name,
               year_of_birth,
               job,
               reviews    
              }}
         );
         if (!results || results.length == 0) { 
           res.status(404).send("Book not found");
        }  
           res.status(200).send(results); 
        }catch (error) {
         res.send({'error':'Internal error'}).status(500);
        }
       });
      
export default router;
