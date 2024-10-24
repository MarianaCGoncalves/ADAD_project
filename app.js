import express from 'express';
import movies from "./routes/movies.js";

const app = express()
const port = 3000
app.get('/', (req, res) => {
res.send('Backend!')
})

app.use(express.json());
// Load the /movies routes
app.use("/movies", movies);

app.listen(port, () => {
    console.log(`backend listening on port ${port}`)
    })