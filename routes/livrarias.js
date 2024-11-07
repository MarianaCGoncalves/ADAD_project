import express from "express";
import db from "../db/config.js";
const router = express.Router();

/*router.get('/test', (req, res) => {
    res.send('Rota de teste funcionando!');
});*/
/*
//1 Endpoint para adicionar um livro específico a uma livraria
router.post('/:livrariaId/addBook/:bookId', async (req, res) => {
    try {
        const { livrariaId, bookId } = req.params;

        // Verificar se o ID da livraria e do livro são válidos
        if (!ObjectId.isValid(livrariaId) || !ObjectId.isValid(bookId)) {
            return res.status(400).json({ error: "ID da livraria ou ID do livro inválido" });
        }

        // Procurar a livraria pelo ID
        const livraria = await db.collection("livrarias").findOne({ _id: new ObjectId(livrariaId) });
        if (!livraria) {
            return res.status(404).json({ error: "Livraria não encontrada" });
        }

        // Verificar se o livro existe na coleção 'books'
        const livro = await db.collection("books").findOne({ _id: new ObjectId(bookId) });
        if (!livro) {
            return res.status(404).json({ error: "Livro não encontrado" });
        }

        // Adicionar o livro à livraria, mantendo os existentes
        const updatedBooks = livraria.books ? livraria.books.concat([bookId]) : [bookId];
        await db.collection("livrarias").updateOne(
            { _id: new ObjectId(livrariaId) },
            { $set: { books: updatedBooks } }
        );

        // Responder com a livraria atualizada
        const updatedLivraria = await db.collection("livrarias").findOne({ _id: new ObjectId(livrariaId) });
        res.status(200).json({ message: "Livro adicionado à livraria com sucesso", livraria: updatedLivraria });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao adicionar o livro à livraria" });
    }
});
//2 Endpoint para consultar livros numa livraria específica
router.get('/:livrariaId/books', async (req, res) => {
    try {
        const { livrariaId } = req.params;


        if (!ObjectId.isValid(livrariaId)) {
            return res.status(400).json({ error: "ID da livraria inválido" });
        }

        const livraria = await db.collection("livrarias").findOne({ _id: new ObjectId(livrariaId) });
        if (!livraria) {
            return res.status(404).json({ error: "Livraria não encontrada" });
        }

       
        if (!livraria.books || livraria.books.length === 0) {
            return res.status(404).json({ message: "Nenhum livro encontrado nesta livraria." });
        }

       
        const livros = await db.collection("books").find({ _id: { $in: livraria.books.map(id => new ObjectId(id)) } }).toArray();

        res.status(200).json({ livraria: livraria.INF_NOME, livros });
    } catch (error) {
        console.error("Erro ao buscar livros na livraria:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});



//3 Endpoint para listar livrarias perto de uma localização
router.get('/nearby', async (req, res) => {
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

        // Converte a distância de metros para radianos (1 radiano = ~6378.1 km)
        const distanceInRadians = distanceNum / 6378100;

        // Pesquisa de livrarias perto da localização especificada
        const livrariasProximas = await db.collection("livrarias").find({
            location: {
                $geoWithin: {
                    $centerSphere: [[longitudeNum, latitudeNum], distanceInRadians]
                }
            }
        }).toArray();

        // Verifica se há resultados
        if (livrariasProximas.length === 0) {
            return res.status(404).json({ message: "Nenhuma livraria encontrada nas proximidades." });
        }

        res.status(200).json(livrariasProximas);
    } catch (error) {
        console.error("Erro ao buscar livrarias próximas:", error);
        res.status(500).json({ error: "Erro no servidor." });
    }
});

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
