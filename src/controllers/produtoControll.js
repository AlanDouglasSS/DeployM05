const express = require('express');
const conexao = require('../conexao/conection');

const router = express.Router();

//=================Cadastrar Produto====================
router.post('/produto', async (req, res) => {
  try {
    const { descricao, quantidade_estoque, valor, categoria_id } = req.body;

    // Validar campos obrigatórios
    if (!descricao || !quantidade_estoque || !valor || !categoria_id) {
      return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    // Verificar se a categoria informada existe
    const queryBuscarCategoria = 'SELECT * FROM categorias WHERE id = $1';
    const valuesBuscarCategoria = [categoria_id];
    const resultadoBuscarCategoria = await conexao.query(queryBuscarCategoria, valuesBuscarCategoria);

    if (resultadoBuscarCategoria.rows.length === 0) {
      return res.status(400).json({ mensagem: 'A categoria informada não existe.' });
    }

    // Lógica para salvar o produto no banco ou na conexão de sua escolha
    const queryCadastrarProduto = 'INSERT INTO produtos (descricao, quantidade_estoque, valor, categoria_id) VALUES ($1, $2, $3, $4)';
    const valuesCadastrarProduto = [descricao, quantidade_estoque, valor, categoria_id];
    await conexao.query(queryCadastrarProduto, valuesCadastrarProduto);

    res.status(201).json({ mensagem: 'Produto cadastrado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar produto.' });
  }
});


//==================Editar dados do produto====================
router.put('/produto/:id', async (req, res) => {
  try {
    const { descricao, quantidade_estoque, valor, categoria_id } = req.body;
    const produtoId = req.params.id;

    // Validar se existe produto para o id enviado como parâmetro na rota
    const queryBuscarProduto = 'SELECT * FROM produtos WHERE id = $1';
    const valuesBuscarProduto = [produtoId];
    const resultadoBuscarProduto = await conexao.query(queryBuscarProduto, valuesBuscarProduto);

    if (resultadoBuscarProduto.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }

    // Validar campos obrigatórios
    if (!descricao || !quantidade_estoque || !valor || !categoria_id) {
      return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    // Verificar se a categoria informada existe
    const queryBuscarCategoria = 'SELECT * FROM categorias WHERE id = $1';
    const valuesBuscarCategoria = [categoria_id];
    const resultadoBuscarCategoria = await conexao.query(queryBuscarCategoria, valuesBuscarCategoria);

    if (resultadoBuscarCategoria.rows.length === 0) {
      return res.status(400).json({ mensagem: 'A categoria informada não existe.' });
    }

    // Lógica para atualizar o produto no banco
    const queryEditarProduto = 'UPDATE produtos SET descricao = $1, quantidade_estoque = $2, valor = $3, categoria_id = $4 WHERE id = $5';
    const valuesEditarProduto = [descricao, quantidade_estoque, valor, categoria_id, produtoId];
    await conexao.query(queryEditarProduto, valuesEditarProduto);

    res.json({ mensagem: 'Produto atualizado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao editar produto.' });
  }
});


//=============================Listar Produtos===========================
router.get('/produto', async (req, res) => {
  try {
    const categoria_id = req.query.categoria_id;

    if (categoria_id) {
      // Filtrar produtos por categoria, caso o id de categoria informada exista
      const queryListarProdutosPorCategoria = 'SELECT * FROM produtos WHERE categoria_id = $1';
      const valuesListarProdutosPorCategoria = [categoria_id];
      const resultadoListarProdutosPorCategoria = await conexao.query(queryListarProdutosPorCategoria, valuesListarProdutosPorCategoria);

      res.json(resultadoListarProdutosPorCategoria.rows);
    } else {
      // Listar todos os produtos cadastrados
      const queryListarProdutos = 'SELECT * FROM produtos';
      const resultadoListarProdutos = await conexao.query(queryListarProdutos);

      res.json(resultadoListarProdutos.rows);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao listar produtos.' });
  }
});



//================Detalhar Produto======================
router.get('/produto/:id', async (req, res) => {
  try {
    const produtoId = req.params.id;

    // Validar se existe produto para o id enviado como parâmetro na rota
    const queryDetalharProduto = 'SELECT * FROM produtos WHERE id = $1';
    const valuesDetalharProduto = [produtoId];
    const resultadoDetalharProduto = await conexao.query(queryDetalharProduto, valuesDetalharProduto);

    if (resultadoDetalharProduto.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }

    res.json(resultadoDetalharProduto.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao detalhar produto.' });
  }
});



//======================Excluir Produto por ID==================
router.delete('/produto/:id', async (req, res) => {
  try {
    const produtoId = req.params.id;

    // Validar se existe produto para o id enviado como parâmetro na rota
    const queryBuscarProduto = 'SELECT * FROM produtos WHERE id = $1';
    const valuesBuscarProduto = [produtoId];
    const resultadoBuscarProduto = await conexao.query(queryBuscarProduto, valuesBuscarProduto);

    if (resultadoBuscarProduto.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Produto não encontrado.' });
    }

    // Lógica para excluir o produto do banco
    const queryExcluirProduto = 'DELETE FROM produtos WHERE id = $1';
    const valuesExcluirProduto = [produtoId];
    await conexao.query(queryExcluirProduto, valuesExcluirProduto);

    res.json({ mensagem: 'Produto excluído com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao excluir produto.' });
  }
});



module.exports = router;