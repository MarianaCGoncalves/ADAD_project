import express from "express";
import db from "../db/config.js";
const router = express.Router();

// Endpoint para listar livros com paginação
// ALTERAR: db.collection.find().skip(10).limit(10);
//exemplo: /users 

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
// 15-(Alex) Endpoint para listar livros com comentários, ordenados pelo número de comentários
router.get('/comments', async (req, res) => {
  try {
      // Realiza a agregação para contar e ordenar os livros com comentários
      let results = await db.collection('books').aggregate([
          {
              $lookup: {
                  from: "comments",             // Associa com a coleção de comentários
                  localField: "_id",            // Campo em livros (assumindo que é o campo `_id`)
                  foreignField: "book_id",      // Campo em comentários que associa com livros
                  as: "book_comments"           // Nome do campo onde os comentários serão armazenados
              }
          },
          {
              $match: { "book_comments.0": { $exists: true } } // Inclui apenas livros que têm pelo menos um comentário
          },
          {
              $addFields: {
                  totalComments: { $size: "$book_comments" } // Adiciona um campo `totalComments` com a contagem de comentários
              }
          },
          {
              $sort: { totalComments: -1 } // Ordena pelo número de comentários em ordem decrescente
          },
          {
              $project: {
                  title: 1,
                  totalComments: 1,
                  book_comments: 1 // Inclui os comentários no resultado
              }
          }
      ]).toArray();

      // Verifica se há resultados
      if (results.length === 0) {
          return res.status(404).send("Nenhum livro com comentários encontrado.");
      }

      res.status(200).json(results);
  } catch (error) {
      console.error("Erro ao buscar livros com comentários:", error);
      res.status(500).send("Erro no servidor.");
  }
});

//endpoint 5
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
  let results = await db.collection('users').aggregate([
    {$unwind: "$reviews"},
    {$match: {"reviews.book_id": id}},

    {$lookup: {
        from:"books",
        localField:"reviews.book_id",
        foreignField:"_id",
        as:"book_info"
    }},

    //{$unwind:"$book_info"},

    {$lookup:{
        from:"comments",
        localField:"reviews.book_id",
        foreignField:"book_id",
        as:"book_comments"
    }},

    //{$unwind:"$book_comments"},

    {$group:
        {
        _id: id,
        avg_score: {$avg:"$reviews.score"},
        info: {$first:"$book_info"},
        comms: {$first:"$book_comments.comment"}
        }

    }

  ]).toArray();

  if (!results || results.length == 0) {  //ver se id existe
    res.status(404).send("Book not found");
 } else { 
    res.status(200).send(results); 
  
 }

} catch (error){
  
    res.send({'error':'Internal error'}).status(500);
 
}
});


//endpoint 7
router.delete('/:id', async (req, res) => {
  try {
  const id = parseInt(req.params.id);
  let results = await db.collection('books').deleteOne({_id: id});
  if (!results || results.length == 0) { 
    res.status(404).send("Book not found");
 } else { 
    res.status(200).send(results); }
 }catch (error) {
  res.send({'error':'Internal error'}).status(500);
 }
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

//endpoint 16
router.get('/job/:job',async (req,res)=> {
  const job = String(req.params.job);
  //console.log(job);
  try{
    let results = await db.collection('users').aggregate([

      {$unwind: "$reviews"},
      {$match: {job: job}},
      {$count: {job}}

    ]).toArray();

    //console.log(results);

      if(!results){
        return res.status(400).send("Couldn't find that job");
      }else{
        return res.status(200).send(results);
      }
  }catch(error){
    return res.status(500).send("Server Error");
  }
})

router.get('/category/:category/price/:price', async(req, res)=> {
  const category = req.params.category;
  const price = parseInt(req.params.price);

  try{
    let results = await db.collection('books').aggregate(
      {$unwind: "category"}
    )

  }catch(error){

  }
})
export default router;

