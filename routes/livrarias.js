import express from "express";
import db from "../db/config.js";
const router = express.Router();


router.get('/test', async (req, res) => {
    try {
        const livrarias = await db.collection('livrarias').find().limit(1).toArray();
        res.status(200).json(livrarias);
    } catch (error) {
        console.error("Erro ao conectar-se à base de dados:", error);
        res.status(500).send("Erro no servidor.");
    }
});

// #1 Endpoint para adicionar um livro específico ao array `books` de uma livraria

// Endpoint para adicionar livros ao array `books` de uma livraria
router.post('/:id', async (req, res) => {
    try {
        // Garante que os IDs dos livros são processados como um array
        const bookIds = Array.isArray(req.body) ? req.body : [req.body];

        // Valida se existem livros correspondentes aos IDs fornecidos
        const books = await db.collection("books").find({ 
            _id: { $in: bookIds }
        }).toArray();

        if (!books.length) {
            return res.status(404).send({ message: "Livros não encontrados" });
        }

        // Atualiza a livraria adicionando apenas os livros encontrados
        const updateResponse = await db.collection("livrarias").updateOne(
            { _id: parseInt(req.params.id) },
            { $push: { books: { $each: books } } }
        );

        if (!updateResponse.matchedCount) {
            return res.status(404).send({ message: "Livraria não encontrada" });
        }

        if (!updateResponse.modifiedCount) {
            return res.status(400).send({ message: "Nenhuma modificação foi feita" });
        }

        res.status(201).send({ message: "Livros adicionados com sucesso à livraria" });
    } catch (err) {
        res.status(500).send({ message: "Erro ao adicionar livros", error: err.message });
    }
});




// #2 Endpoint para consultar livros numa livraria específica
router.get('/id/:id', async (req, res) => { //acrecentei o /id senao os endpoints seguintes não funcionam


    try {
      const livraria = await db.collection("livrarias").findOne(
        { _id: parseInt(req.params.id) },
        { projection: { books: 1 } }
      );
  
      if (!livraria) {
        return res.status(404).json({ message: "Livraria não encontrada" });
      }
  
      res.status(200).json(livraria.books);
    } catch (error) {
      res.status(500).json({ message: "Erro ao consultar livros", error: error.message });
    }
  });


// #3 Endpoint para listar livrarias perto de uma localização (Maria)
router.get('/nearLocation', async (req, res) => {
    try {
        const { latitude, longitude, distancia } = req.query;

        const latitude2 = parseFloat(latitude);
        const longitude2 = parseFloat(longitude);
        const distancia2 = parseFloat(distancia);

        await db.collection("livrarias").createIndex({ location: "2dsphere"});

        let results = await db.collection("livrarias").find(
            {
                "geometry.coordinates": {
                    $geoWithin: {
                        $centerSphere: [[longitude2, latitude2], distancia2 / 3963.2] //para obter a distancia em radianos é preciso dividir pelo nº de milhas da Terra
                    }
                }
            }
        ).toArray();

        if(results.length == 0){
            return res.status(404).send("Nenhuma livraria próxima");
          }else{
            return res.status(200).send(results);
          }
    } catch (error) {
        return res.status(500).send("Server Error");
    }
});



//#4 Lista de livrarias perto do caminho de uma rota (Maria e Mariana)
router.get('/pertoRota', async (req, res) => {
    try {
        const coordenadas = JSON.parse(req.query.coordenadas);


        await db.collection("livrarias").createIndex({ location: "2dsphere"});

        console.log(coordenadas); 

        let results = await db.collection("livrarias").find(
            {
                "geometry.coordinates": {
                    $geoIntersects: {
                        $geometry: {
                            type: 'LineString',
                            coordinates: coordenadas
                        }
                    }
                }
            }
        ).toArray();


        if(results == 0){
            return res.status(404).send("Não existem livrarias perto da rota");
          }else{
            return res.status(200).send(results);
          }
    } catch (error) {
        return res.status(500).send("Server Error");
    }
});



// #5 Retornar número de livrarias perto de uma localização (Maria)
router.get('/quantasPerto', async (req, res) => {
    try {
        const { latitude, longitude, distancia } = req.query;

        const latitude2 = parseFloat(latitude);
        const longitude2 = parseFloat(longitude);
        const distancia2 = parseFloat(distancia);

        await db.collection("livrarias").createIndex({ location: "2dsphere"});

        let results = await db.collection("livrarias").countDocuments(
            {
                "geometry.coordinates": {
                    $geoWithin: {
                        $centerSphere: [[longitude2, latitude2], distancia2 / 3963.2] //para obter a distancia em radianos é preciso dividir pelo nº de milhas da Terra
                    }
                }
            }
        );
       
        console.log(results);

        if(results == 0){
            return res.status(404).send("Não existem livrarias perto");
          }else{
            return res.status(200).json({ quantidade: results });
          }
    } catch (error) {
        return res.status(500).send("Server Error");
    }
});

//#6 Verificar se um determinado user (Ponto) se encontra dentro da feira
//do livro. Coordenadas para testar: [-9.155644342145884,38.72749043040882] (Mariana)
router.get('/feiraLivro', async (req, res) => {
    try {
        const { latitude, longitude } = req.query;

        const latitude2 = parseFloat(latitude);
        const longitude2 = parseFloat(longitude);

        await db.collection("livrarias").createIndex({ location: "2dsphere"});

        let results = await db.collection("livrarias").find(
            {
                "geometry.coordinates": {
                    $geoIntersects: {
                        $geometry: {
                            type: "Point",
                            coordinates: [longitude2, latitude2]
                        }
                    }
                }
            }
        );

        if(results == 0){
            return res.status(404).send("Não está na feira do livro");
          }else{
            return res.status(200).send("Está na feira do livro");
          }
    } catch (error) {
        return res.status(500).send("Server Error");
    }
});

export default router;
