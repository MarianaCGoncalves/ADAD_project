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

// Endpoint para adicionar um livro específico ao array `books` de uma livraria
router.post('/:id', async (req, res) => {
    const bookIds = Array.isArray(req.body) ? req.body : [req.body]; // Verifica se é um array ou um único ID

    try {
        const books = await db.collection("books").find({ 
            _id: { $in: bookIds } // Passa diretamente os IDs
        }).toArray();

        if (books.length === 0) {
            return res.status(404).json({ message: "Nenhum livro encontrado" });
        }

        // Adiciona os livros completos à livraria
        const result = await db.collection("livrarias").updateOne(
            { _id: parseInt(req.params.id) },  // Encontra a livraria pelo ID
            { $push: { books: { $each: books } } }  // Adiciona os livros completos
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Livraria não encontrada" });
        }

        res.status(201).json({ message: "Livros adicionados à livraria com sucesso" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao adicionar livros", error: error.message });
    }
});



// #2 Endpoint para consultar livros numa livraria específica
router.get('/:id', async (req, res) => {


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

/*
//2 Endpoint para consultar livros numa livraria específica
router.get('/:livrariaId/books', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        let results = await db.collection("livrarias").aggregate(
            {$match: { _id: id}},
            {$project: {
                books: "$books"
            }
            }
        
        ).toArray();

        /*
        if (!livraria) {
            return res.status(404).json({ error: "Livraria não encontrada" });
        }

       
        if (!livraria.books || livraria.books.length === 0) {
            return res.status(404).json({ message: "Nenhum livro encontrado nesta livraria." });
        }

       
        const livros = await db.collection("books").find({ _id: { $in: livraria.books.map(id => new ObjectId(id)) } }).toArray();

        res.status(200).json({ livraria: livraria.INF_NOME, livros });
        */
        if(!results){
            return res.status(400).send("Couldn't find books");
          }else{
            return res.status(200).send(results);
          }

    } catch (error) {
        console.error("Erro ao encontrar livros na livraria:", error);
        return res.status(500).send("Server Error");
    }
});


//3 Endpoint para listar livrarias perto de uma localização
router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, distance } = req.query;

        let results = await db.collection("livrarias").find(
            {
                location: {
                    $geoWithin: {
                        $center: [[latitude, longitude], distance]
                    }
                }
            }
        ).toArray();
       

        // Verifica se os parâmetros são válidos
        if (!latitude || !longitude || !distance) {
            return res.status(400).json({ error: "Latitude, longitude e distância são obrigatórios." });
        }

        const latitudeNum = parseFloat(latitude);
        const longitudeNum = parseFloat(longitude);
        const distanceNum = parseFloat(distance);

        if (isNaN(latitudeNum) || isNaN(longitudeNum) || isNaN(distanceNum)) {
            return res.status(400).json({ error: "Latitude, longitude e distância devem ser números válidos." });
        }

        // Converte a distância de metros para radianos (1 radiano = ~6378.1 km)
        const distanceInRadians = distanceNum / 6378100;


        if(!results){
            return res.status(400).send("Nenhuma livraria próxima");
          }else{
            return res.status(200).send(results);
          }
    } catch (error) {
        return res.status(500).send("Server Error");
    }
});

/*
//4 Endpoint para listar livrarias perto de uma rota
router.post('/route', async (req, res) => {
    try {
        const { path, distance } = req.body;

        // Verifica se os parâmetros são válidos
        if (!path || !Array.isArray(path) || path.length < 2) {
            return res.status(400).json({ error: "O caminho deve ser uma array de coordenadas com pelo menos dois pontos." });
        }
        if (!distance || isNaN(parseFloat(distance))) {
            return res.status(400).json({ error: "Distância máxima deve ser um número válido." });
        }

        const distanceNum = parseFloat(distance);

        // Constrói o objeto LineString a partir do caminho
        const lineString = {
            type: "LineString",
            coordinates: path
        };

        // Pesquisa de livrarias próximas da linha (rota) com uma distância máxima
        const livrariasProximas = await db.collection("livrarias").aggregate([
            {
                $geoNear: {
                    near: {
                        $geometry: lineString
                    },
                    distanceField: "distance",
                    maxDistance: distanceNum,
                    spherical: true
                }
            }
        ]).toArray();

        // Verifica se há resultados
        if (livrariasProximas.length === 0) {
            return res.status(404).json({ message: "Nenhuma livraria encontrada ao longo da rota especificada." });
        }

        res.status(200).json(livrariasProximas);
    } catch (error) {
        console.error("Erro ao buscar livrarias próximas da rota:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

//5 Endpoint para contar livrarias perto de uma localização
router.get('/countNearby', async (req, res) => {
    try {
        const { latitude, longitude, distance } = req.query;

        // Verifica se os parâmetros são válidos
        if (!latitude || !longitude || !distance) {
            return res.status(400).json({ error: "Latitude, longitude e distância são obrigatórios." });
        }

        const latitudeNum = parseFloat(latitude);
        const longitudeNum = parseFloat(longitude);
        const distanceNum = parseFloat(distance);

        if (isNaN(latitudeNum) || isNaN(longitudeNum) || isNaN(distanceNum)) {
            return res.status(400).json({ error: "Latitude, longitude e distância devem ser números válidos." });
        }

        // Converte a distância de metros para radianos
        const distanceInRadians = distanceNum / 6378100;

        // Conta as livrarias dentro do raio especificado
        const count = await db.collection("livrarias").countDocuments({
            location: {
                $geoWithin: {
                    $centerSphere: [[longitudeNum, latitudeNum], distanceInRadians]
                }
            }
        });

        res.status(200).json({ count });
    } catch (error) {
        console.error("Erro ao contar livrarias próximas:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

*/
export default router;
