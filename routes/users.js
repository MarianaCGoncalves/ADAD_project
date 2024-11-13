import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
const router = express.Router();

//EXEMPLO DE PAGINAÇÃO
//endpoint 2 
router.get("/page/:page", async (req, res) => { 
    let page = parseInt(req.params.page) * 10;
    let results = await db.collection('users').find({})
    .limit(10).skip(page)
    .toArray();
    res.send(results).status(200);
});


// Endpoint 2 -(Ricardo) Listar users com paginação 

router.get('/', async (req, res) => {
   const page = parseInt(req.query.page) || 1; 
   const max = parseInt(req.query.max) || 20;
    try {
     const users = (await db.collection('users').find().sort({ _id: 1 }).skip((page - 1) * max).limit(max).toArray());
     res.status(200).json({ page, max, users });
   } catch (error) {
     res.status(500).json({ message: "Erro" });
   }
 });



//endpoint 6 (Maria)
router.get("/:id", async (req, res) => {
    try{
    const id = parseInt(req.params.id);
    verifyId(id);
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
    if(!results){
      return res.status(400).send("Couldn't find that user");
    }else{
      return res.status(200).send(results);
    }

   }catch (error) {
    return res.status(500).send("Server Error");
   }
    }); 


    //endpoint 8 (Maria)
    router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        verifyId(id);
        let results = await db.collection('users').deleteOne({_id: id});

        if(!results){
         return res.status(400).send("Couldn't find that user");
       }else{
         return res.status(200).send(results);
       }
   
      }catch (error) {
       return res.status(500).send("Server Error");
      }
      });


      //endpoint 10 (Maria)
      router.put('/:id', async (req, res) => {
         try {
         const id = parseInt(req.params.id);
         verifyId(id);
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
         if(!results){
            return res.status(400).send("Couldn't find that user");
          }else{
            return res.status(200).send(results);
          }
      
         }catch (error) {
          return res.status(500).send("Server Error");
         }
       });
      
export default router;
