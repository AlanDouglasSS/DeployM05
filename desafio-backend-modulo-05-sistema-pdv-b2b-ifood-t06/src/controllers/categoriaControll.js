const express = require('express');
const autenticacaoMiddleware = require('./autenticacaoMiddleware');
const conexao = require('../conexao/conection');

const router = express.Router();

const listarCategorias = async (req, res) => {
  try {
    // Lógica para buscar todas as categorias no banco de dados
    const query = 'SELECT * FROM categorias';
    const resultado = await conexao.query(query);

    // Retorno das categorias como resposta
    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao listar categorias.' });
  }
};

router.get('/categoria', autenticacaoMiddleware, listarCategorias);

module.exports = router;