const express = require('express');
const conexao = require('../conexao/conection');

const router = express.Router();

//=================Cadastrar Pedido====================
router.post('/pedido', async (req, res) => {
  try {
    const { cliente_id, observacao, pedido_produtos } = req.body;

    // Validar campos obrigatórios
    if (!cliente_id || !pedido_produtos || pedido_produtos.length === 0) {
      return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    // Verificar se o cliente informado existe
    const queryBuscarCliente = 'SELECT * FROM clientes WHERE id = $1';
    const valuesBuscarCliente = [cliente_id];
    const resultadoBuscarCliente = await conexao.query(queryBuscarCliente, valuesBuscarCliente);

    if (resultadoBuscarCliente.rows.length === 0) {
      return res.status(400).json({ mensagem: 'O cliente informado não existe.' });
    }

    // Validar produtos e quantidade em estoque
    for (const produto of pedido_produtos) {
      const { produto_id, quantidade_produto } = produto;

      const queryBuscarProduto = 'SELECT * FROM produtos WHERE id = $1';
      const valuesBuscarProduto = [produto_id];
      const resultadoBuscarProduto = await conexao.query(queryBuscarProduto, valuesBuscarProduto);

      if (resultadoBuscarProduto.rows.length === 0) {
        return res.status(400).json({ mensagem: `O produto com ID ${produto_id} não existe.` });
      }

      const produtoEstoque = resultadoBuscarProduto.rows[0];
      if (produtoEstoque.quantidade_estoque < quantidade_produto) {
        return res.status(400).json({
          mensagem: `A quantidade em estoque do produto com ID ${produto_id} é insuficiente.`,
        });
      }
    }

    // Calcular valor total do pedido
    let valorTotal = 0;
    for (const produto of pedido_produtos) {
      const { produto_id, quantidade_produto } = produto;

      const queryBuscarProduto = 'SELECT * FROM produtos WHERE id = $1';
      const valuesBuscarProduto = [produto_id];
      const resultadoBuscarProduto = await conexao.query(queryBuscarProduto, valuesBuscarProduto);

      const produtoEstoque = resultadoBuscarProduto.rows[0];
      valorTotal += produtoEstoque.valor * quantidade_produto;
    }

    // Iniciar transação no banco
    await conexao.query('BEGIN');

    // Cadastrar pedido
    const queryCadastrarPedido =
      'INSERT INTO pedidos (cliente_id, observacao, valor_total) VALUES ($1, $2, $3) RETURNING id';
    const valuesCadastrarPedido = [cliente_id, observacao, valorTotal];
    const resultadoCadastrarPedido = await conexao.query(queryCadastrarPedido, valuesCadastrarPedido);
    const pedidoId = resultadoCadastrarPedido.rows[0].id;

    // Cadastrar produtos no pedido
    for (const produto of pedido_produtos) {
      const { produto_id, quantidade_produto } = produto;

      const queryCadastrarPedidoProduto =
        'INSERT INTO pedido_produtos (pedido_id, produto_id, quantidade_produto, valor_produto) VALUES ($1, $2, $3, $4)';
      const valuesCadastrarPedidoProduto = [pedidoId, produto_id, quantidade_produto, quantidade_produto * valorTotal];
      await conexao.query(queryCadastrarPedidoProduto, valuesCadastrarPedidoProduto);

      // Atualizar quantidade em estoque
      const queryAtualizarEstoque =
        'UPDATE produtos SET quantidade_estoque = quantidade_estoque - $1 WHERE id = $2';
      const valuesAtualizarEstoque = [quantidade_produto, produto_id];
      await conexao.query(queryAtualizarEstoque, valuesAtualizarEstoque);
    }

    // Confirmar transação no banco
    await conexao.query('COMMIT');

    // Enviar e-mail para o cliente
    // (Lógica para envio de e-mail não implementada neste exemplo)

    res.status(201).json({ mensagem: 'Pedido cadastrado com sucesso!' });
  } catch (error) {
    // Rollback em caso de erro
    await conexao.query('ROLLBACK');

    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar pedido.' });
  }
});

//=============================Listar Pedidos===========================
router.get('/pedido', async (req, res) => {
  try {
    const cliente_id = req.query.cliente_id;

    if (cliente_id) {
      // Filtrar pedidos por cliente, caso o id do cliente informado exista
      const queryListarPedidosPorCliente =
        'SELECT p.id, p.valor_total, p.observacao, p.cliente_id, pp.id as produto_id, pp.quantidade_produto, pp.valor_produto FROM pedidos p INNER JOIN pedido_produtos pp ON p.id = pp.pedido_id WHERE p.cliente_id = $1';
      const valuesListarPedidosPorCliente = [cliente_id];
      const resultadoListarPedidosPorCliente = await conexao.query(
        queryListarPedidosPorCliente,
        valuesListarPedidosPorCliente
      );

      const pedidos = resultadoListarPedidosPorCliente.rows.map((pedido) => ({
        pedido: {
          id: pedido.id,
          valor_total: pedido.valor_total,
          observacao: pedido.observacao,
          cliente_id: pedido.cliente_id,
        },
        pedido_produtos: [
          {
            id: pedido.produto_id,
            quantidade_produto: pedido.quantidade_produto,
            valor_produto: pedido.valor_produto,
            pedido_id: pedido.id,
            produto_id: pedido.produto_id,
          },
        ],
      }));

      res.json(pedidos);
    } else {
      // Listar todos os pedidos cadastrados
      const queryListarPedidos =
        'SELECT p.id, p.valor_total, p.observacao, p.cliente_id, pp.id as produto_id, pp.quantidade_produto, pp.valor_produto FROM pedidos p INNER JOIN pedido_produtos pp ON p.id = pp.pedido_id';
      const resultadoListarPedidos = await conexao.query(queryListarPedidos);

      const pedidos = resultadoListarPedidos.rows.map((pedido) => ({
        pedido: {
          id: pedido.id,
          valor_total: pedido.valor_total,
          observacao: pedido.observacao,
          cliente_id: pedido.cliente_id,
        },
        pedido_produtos: [
          {
            id: pedido.produto_id,
            quantidade_produto: pedido.quantidade_produto,
            valor_produto: pedido.valor_produto,
            pedido_id: pedido.id,
            produto_id: pedido.produto_id,
          },
        ],
      }));

      res.json(pedidos);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao listar pedidos.' });
  }
});

//================Excluir Produto Vinculado a Pedido======================
router.delete('/produto/:id', async (req, res) => {
  try {
    const produtoId = req.params.id;

    // Validar se o produto está vinculado a algum pedido
    const queryVerificarVinculo =
      'SELECT * FROM pedido_produtos WHERE produto_id = $1 LIMIT 1';
    const valuesVerificarVinculo = [produtoId];
    const resultadoVerificarVinculo = await conexao.query(
      queryVerificarVinculo,
      valuesVerificarVinculo
    );

    if (resultadoVerificarVinculo.rows.length > 0) {
      return res.status(400).json({
        mensagem: 'Não é possível excluir um produto vinculado a um pedido.',
      });
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

//================Aprimorar Cadastro/Atualização de Produto com Imagem====================
router.post('/produto', async (req, res) => {
  try {
    const { descricao, quantidade_estoque, valor, categoria_id, produto_imagem } = req.body;

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
    const queryCadastrarProduto = 'INSERT INTO produtos (descricao, quantidade_estoque, valor, categoria_id, produto_imagem) VALUES ($1, $2, $3, $4, $5)';
    const valuesCadastrarProduto = [descricao, quantidade_estoque, valor, categoria_id, produto_imagem];
    await conexao.query(queryCadastrarProduto, valuesCadastrarProduto);

    res.status(201).json({ mensagem: 'Produto cadastrado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar produto.' });
  }
});

//================Aprimorar Exclusão de Produto com Imagem====================
router.delete('/produto/:id', async (req, res) => {
    try {
      const produtoId = req.params.id;
  
      // Validar se o produto está vinculado a algum pedido
      const queryVerificarVinculo =
        'SELECT * FROM pedido_produtos WHERE produto_id = $1 LIMIT 1';
      const valuesVerificarVinculo = [produtoId];
      const resultadoVerificarVinculo = await conexao.query(
        queryVerificarVinculo,
        valuesVerificarVinculo
      );
  
      if (resultadoVerificarVinculo.rows.length > 0) {
        return res.status(400).json({
          mensagem: 'Não é possível excluir um produto vinculado a um pedido.',
        });
      }
  
      // Buscar o nome do arquivo de imagem no banco
      const queryBuscarImagem = 'SELECT produto_imagem FROM produtos WHERE id = $1';
      const valuesBuscarImagem = [produtoId];
      const resultadoBuscarImagem = await conexao.query(queryBuscarImagem, valuesBuscarImagem);
  
      if (resultadoBuscarImagem.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Produto não encontrado.' });
      }
  
      const nomeArquivo = resultadoBuscarImagem.rows[0].produto_imagem;
  
      // Lógica para excluir o produto do banco
      const queryExcluirProduto = 'DELETE FROM produtos WHERE id = $1';
      const valuesExcluirProduto = [produtoId];
      await conexao.query(queryExcluirProduto, valuesExcluirProduto);
  
      // Excluir a imagem do servidor de armazenamento
      if (nomeArquivo) {
        // Lógica para excluir a imagem do servidor de armazenamento (não implementada neste exemplo)
        // Aqui você deve incluir a lógica específica para o seu serviço de armazenamento (por exemplo, Blackblaze, Supabase, etc.)
      }
  
      res.json({ mensagem: 'Produto excluído com sucesso!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: 'Erro ao excluir produto.' });
    }
  });
  
  module.exports = router;