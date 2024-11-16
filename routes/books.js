import express from "express";
import db from "../db/config.js";
import { verifyId } from "./comments.js";
const router = express.Router();


// 1 - (Ricardo ) Endpoint para listar livros com paginação
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const max = parseInt(req.query.max) || 20;
   try {
    const books = (await db.collection('books').find().sort({ _id: 1 }).skip((page - 1) * max).limit(max).toArray());
    res.status(200).json({ page, max, books });
  } catch (error) {
    res.status(500).json({ message: "Erro" });
  }
});

//(Ricardo) endpoint 3 - inserir um ou mais books

router.post('/', async (req, res) => {
  const livroDado = Array.isArray(req.body) ? req.body : [req.body]; // Converte para array, caso não seja

  try {
    const insertionResult = await db.collection('books').insertMany(livroDado);
    res.status(201).json({ 
      message: 'Livros adicionados com sucesso', 
      totalInserted: insertionResult.insertedCount 
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar livros', details: error.message });
  }
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

  //endpoint 5 (Maria)
  router.get('/id/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    verifyId(id);
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

    if(results == 0){
      return res.status(404).send("Couldn't find that book");
    }else{
      return res.status(200).send(results);
    }

   }catch (error) {
    return res.status(500).send("Server Error");
   }
  });


  //endpoint 7 (Maria)
  router.delete('/:id', async (req, res) => {
    try {
    const id = parseInt(req.params.id);
    verifyId(id);
    let results = await db.collection('books').deleteOne({_id: id});
    if(results == 0){
      return res.status(404).send("Couldn't find that book");
    }else{
      return res.status(200).send(results);
    }

   }catch (error) {
    return res.status(500).send("Server Error");
   }
  });


  //endpoint 9 (Maria)
  router.put('/:id', async (req, res) => {
    try {
    const id = parseInt(req.params.id);
    verifyId(id);
    const {title,
        isbn,
        pageCount,
        publishedDate,
        thumbnailUrl,
        shortDescription,
        longDescription,
        status,
        authors,
        categories } = req.body; //o rec.body contem os dados do corpo pedido no http

    let results = await db.collection('books').updateOne(
        {_id: id},
        {$set: {title,
                isbn,
                pageCount,
                publishedDate,
                thumbnailUrl,
                shortDescription,
                longDescription,
                status,
                authors,
                categories     
         }}
    );
    if(results == 0){
      return res.status(404).send("Couldn't find that book");
    }else{
      return res.status(200).send(results);
    }

   }catch (error) {
    return res.status(500).send("Server Error");
   }
  });


//14(Alex)- Endpoint para listar livros avaliados num ano específico
router.get('/year/:year', async (req, res) => {
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
      {$count: job}

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
});
//endpoint 17
router.get('/category/:category/price/:price/author/:author', async(req, res)=> {
  const category = req.params.category;
  const price = parseInt(req.params.price);
  const author = req.params.author;

  try{
    let results = await db.collection('books').aggregate([
      {$unwind: "$categories"}, {$unwind: "$authors"},
      {$match: {
          $and:[
              {categories: category},
              {authors: {$regex: author}},
              {price: {$lte: price}}
              ]}
      },
      {$group:  { 
          _id: "$_id", 
          title: { $first: "$title" },
          isbn:{$first: "$isbn"},
          pageCount:{$first: "$pageCount"},
          thumbnailUrl:{$first: "$thumbnailUrl"},
          longDescription:{$first: "longDescription"},
          status:{$first:"$status"},
          categories: { $first: "$categories" },
          authors: { $first: "$authors" },
          price: { $first: "$price" }}
      }
  ]).toArray();
    if(!results){
      res.status(404).send("Couldn't find the book");
    }else{
      res.status(200).send(results);
    }
  }catch(error){
      return res.status(500).send("Server Error");
  }
});
//endpoint 11
router.get('/top/:limit', async(req, res)=> {
  const limit = parseInt(req.params.limit);
  try{
    let results = await db.collection('users').aggregate([ 

      {$unwind: "$reviews"},

      {$lookup: {
          from:"books",
          localField:"reviews.book_id",
          foreignField:"_id",
          as:"book_info"
      }},
      {$group: {
        _id: "$reviews.book_id",
        avg_score: {$avg: "$reviews.score"},
        info: {$first: "$book_info"}
    }},
      //{$unwind: "$book_info"},



      {$sort: {"avg_score":-1}},
      {$limit: limit}
    ]).toArray();

    if(!results){
      return res.status(400).send("Couldn't find that job");
    }else{
      return res.status(200).send(results);
    }
}catch(error){
  return res.status(500).send("Server Error");
}
});

//endpoint 12
router.get('/ratings/:order', async(req, res)=> {
    try{
      let order = req.params.order;
      console.log(order);
      if(order == "asc"){
        order = 1;
      }else{
        order = -1;
      }
      console.log(order);

      let results = await db.collection('users').aggregate([
        {$unwind: "$reviews"},
          {$lookup: {
            from: "books",
            localField: "reviews.book_id",
            foreignField: "_id",
            as: "book_info"
          }},
        {$group: {
            _id: "$reviews.book_id",
            book_title:{$first:"$book_info.title"},
            number_reviews:{$count: {}}
        }},
        {$sort: {number_reviews: order}} 
      ]).toArray();

      if(!results){
        res.status(404).send("Couldn't find the book");
      }else{
        res.status(200).send(results);
      }
  }catch(error){
      return res.status(500).send("Server Error");
  }
});

//endpoint 13
router.get('/star', async(req, res)=> {
  try{
    let results = await db.collection('users').aggregate([
      {$unwind: "$reviews"},
        {$lookup: {
            from: "books",
            localField: "reviews.book_id",
            foreignField: "_id",
            as: "book_info"
         }},
        {$match: {"reviews.score" : 5}},
          {$group: {
            _id: "$reviews.book_id",
            book_title: {$first: "$book_info.title"},
            total_5_reviews:{$count: {}}
          }}   
    ]).toArray();
    if(!results){
      res.status(404).send("Couldn't find the books");
    }else{
      res.status(200).send(results);
    }
}catch(error){
    return res.status(500).send("Server Error");
}
});

export default router;

