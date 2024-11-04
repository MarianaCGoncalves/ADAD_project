import express from 'express';
import books from "./routes/books.js";
import users from "./routes/users.js";
import comments from "./routes/comments.js";
import livrarias from "./routes/livrarias.js";

const app = express();
const port = 3000;

app.use(express.json());

// Load the routes
app.use("/books", books);
app.use("/users", users);
app.use("/comments", comments);
app.use("/livrarias", livrarias);

// Remove 'require' and directly use the already imported 'books' route
//app.use('/api', books);
console.log("Rota livrarias carregada");  // Adiciona esta linha para verificar se a rota é carregada
app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});

