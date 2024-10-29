import express from "express";
import db from "../db/config.js";
const router = express.Router();

// Endpoint para listar livros com paginação
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

export default router;

