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


//14(Alex)- Endpoint para listar livros avaliados num ano específico
router.get('/year/:year', async (req, res) => { // Alterado para `/year/:year`
  const year = parseInt(req.params.year); // Converte o ano para um número inteiro

  try {
      // Define o intervalo de datas para o ano especificado
      const startDate = new Date(`${year}-01-01T00:00:00Z`);
      const endDate = new Date(`${year + 1}-01-01T00:00:00Z`);

      // Consulta para obter livros publicados dentro do intervalo de datas do ano especificado
      let results = await db.collection('books').find({
          publishedDate: {
              $gte: startDate,
              $lt: endDate
          }
      }).toArray();

      if (results.length === 0) {
          return res.status(404).send("Nenhum livro encontrado para o ano especificado.");
      }

      res.status(200).json(results);
  } catch (error) {
      console.error("Erro ao buscar livros por ano:", error);
      res.status(500).send("Erro no servidor.");
  }
});
      
//15-(Alex) Endpoint para listar livros com comentários, ordenados pelo número de comentários
router.get('/comments', async (req, res) => {
  try {
      // Realiza uma agregação para contar comentários e ordenar
      let results = await db.collection('books').aggregate([
          {
              $lookup: {
                  from: "comments",
                  localField: "_id", // Usa `_id` diretamente como número em `books`
                  foreignField: "book_id", // Assume `book_id` como número em `comments`
                  as: "book_comments"
              }
          },
          {
              $match: { "book_comments.0": { $exists: true } } // Filtra livros que têm pelo menos um comentário
          },
          {
              $addFields: {
                  totalComments: { $size: "$book_comments" } // Conta o número de comentários
              }
          },
          {
              $sort: { totalComments: -1 } // Ordena pelo número total de comentários em ordem decrescente
          },
          {
              $project: {
                  title: 1,
                  totalComments: 1,
                  book_comments: 1 // Inclui os comentários, caso queiras ver os detalhes
              }
          }
      ]).toArray();

      if (results.length === 0) {
          return res.status(404).send("Nenhum livro com comentários encontrado.");
      }

      res.status(200).json(results);
  } catch (error) {
      console.error("Erro ao buscar livros com comentários:", error);
      res.status(500).send("Erro no servidor.");
  }
});


export default router;

