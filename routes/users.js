import express from "express";
import db from "../db/config.js";
import { ObjectId } from "mongodb";
import { verifyId } from "./comments.js";
const router = express.Router();




// Endpoint 2 -(Ricardo) Listar users com paginação 

router.get('/', async (req, res) => {
  let page = parseInt(req.query.page);
  const max = parseInt(req.query.max) || 20;

  if (page < 1) {
    return res.status(400).json({
      message: 'A página deve ser um número válido maior ou igual a 1.',
    });
  }

  try {
    const totalUsers = await db.collection('users').countDocuments();
    const totalPages = Math.ceil(totalUsers / max);

    if (page > totalPages) {
      return res.status(400).json({
        message: `Página inválida. Escolha uma página entre 1 e ${totalPages}.`,
      });
    }

    const users = await db.collection('users')
      .find()
      .sort({ _id: 1 })
      .skip((page - 1) * max)
      .limit(max)
      .toArray();

    res.status(200).json({
      pages: {
        current: page,
        next: page < totalPages ? page + 1 : null,
        last: page > 1 ? page - 1 : null,
        total: totalPages,
      },
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Erro", error: error.message });
  }
});




 //Endpoint 4 - (Ricardo) Inserir um ou mais users 

 router.post('/', async (req, res) => {
  const userDado = Array.isArray(req.body) ? req.body : [req.body]; // Converte para array, caso não seja

  try {
    const insertionResult = await db.collection('users').insertMany(userDado);
    res.status(201).json({ 
      message: 'Users adicionados com sucesso', 
      totalInserted: insertionResult.insertedCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar Users', details: error.message });
  }
});



//endpoint 6 (Maria)
router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    verifyId(id);

    let results = await db.collection('users').aggregate([
      { $match: { _id: id } }, // Filtra o utilizador pelo ID
      { $unwind: "$reviews" }, // Divide as reviews para processamento
      { $sort: { "reviews.score": -1 } }, // Ordena por score decrescente
      { $limit: 3 }, // Limita a 3 avaliações
      { $lookup: { // Junta os detalhes dos livros à coleção de reviews
          from: "books",
          localField: "reviews.book_id",
          foreignField: "_id",
          as: "book_details"
      }},
      { $unwind: "$book_details" }, // Torna os detalhes dos livros acessíveis
      { $lookup: { // Junta os comentários apenas dos top 3 livros
          from: "comments",
          let: { bookId: "$reviews.book_id" }, // Variável para o ID do livro
          pipeline: [
            { $match: { $expr: { $eq: ["$book_id", "$$bookId"] } } }, // Verifica se há comentários para o livro
            { $project: { _id: 1, user_id: 1, book_id: 1, comment: 1, date: 1 } } // Retorna apenas os campos necessários
          ],
          as: "book_comments" // Adiciona os comentários dos livros
      }},
      { $group: { // Agrupa os resultados para criar um objeto completo
          _id: "$_id",
          first_name: { $first: "$first_name" },
          last_name: { $first: "$last_name" },
          year_of_birth: { $first: "$year_of_birth" },
          job: { $first: "$job" },
          reviews: { $push: {
              book_id: "$reviews.book_id",
              score: "$reviews.score",
              recommendation: "$reviews.recommendation",
              review_date: "$reviews.review_date",
              thumbnailUrl: "$book_details.thumbnailUrl",
              title: "$book_details.title",
              authors: "$book_details.authors",
              categories: "$book_details.categories",
              price: "$book_details.price",
              pageCount: "$book_details.pageCount",
              comments: "$book_comments" // Inclui os comentários associados ao livro
          }}
      }}
    ]).toArray();

    if (results.length === 0) {
      return res.status(404).send("Couldn't find that user");
    } else {
      return res.status(200).send(results);
    }
  } catch (error) {
    return res.status(500).send("Server Error");
  }
});




    //endpoint 8 (Maria)
    router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        verifyId(id);
        let results = await db.collection('users').deleteOne({_id: id});

        if(results == 0){
         return res.status(404).send("Couldn't find that user");
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
            return res.status(404).send("Couldn't find that user");
          }else{
            return res.status(200).send(results);
          }
      
         }catch (error) {
          return res.status(500).send("Server Error");
         }
       });
      
export default router;
