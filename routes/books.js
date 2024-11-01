import express from "express";
import db from "../db/config.js";
const router = express.Router();

// Endpoint para listar livros com paginação
// ALTERAR: db.collection.find().skip(10).limit(10);
router.get('/', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
  
    const paginatedBooks = books.slice(startIndex, endIndex);
    
    res.status(200).json({
      page,
      limit,
      totalBooks: books.length,
      totalPages: Math.ceil(books.length / limit),
      books: paginatedBooks
    });
  });

  router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let results = await db.collection('users').aggregate([
      {$unwind: "$reviews"},
      {$match: {"reviews.book_id": id}},
  
      {$lookup: {
          from:"books",
          localField:"reviews.book_id",
          foreignField:"_id",
          as:"book_info"
      }},
  
      {$unwind:"$book_info"},
  
      {$lookup:{
          from:"comments",
          localField:"reviews.book_id",
          foreignField:"book_id",
          as:"book_comments"
      }},
  
      {$unwind:"$book_comments"},
  
      {$group:
          {
          _id: id,
          avg_score: {$avg:"$reviews.score"},
          info: {$first:"$book_info"},
          comms: {$push:"$book_comments.comment"}
          }
  
      }
  
    ]).toArray();

    if (!results || results.length === 0) { 
      res.status(404).send("Book not found");
   } else { 
      res.status(200).send(results); }
  });

  router.delete('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    let results = await db.collection('books').deleteOne({_id: id});
    if (!results || results.length === 0) { 
      res.status(404).send("Book not found");
   } else { 
      res.status(200).send(results); }
  });


   
      

export default router;

