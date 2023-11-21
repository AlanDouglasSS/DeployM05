const express = require('express');
const conexao = require('../conexao/conection');

const router = express.Router();

// Cadastrar Cliente
router.post('/cliente', async (req, res) => {
  try {
    const { nome, email, cpf, cep, rua, numero, bairro, cidade, estado } = req.body;

    // Validar campos obrigatórios
    if (!nome || !email || !cpf) {
      return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    // Verificar se o cliente já existe no banco de dados
    const queryBuscarCliente = 'SELECT * FROM clientes WHERE email = $1 OR cpf = $2';
    const valuesBuscarCliente = [email, cpf];
    const resultadoBuscarCliente = await conexao.query(queryBuscarCliente, valuesBuscarCliente);

    if (resultadoBuscarCliente.rows.length > 0) {
      return res.status(400).json({ mensagem: 'Cliente já cadastrado.' });
    }

    // Lógica para cadastrar o cliente no banco
    const queryCadastrarCliente = 'INSERT INTO clientes (nome, email, cpf, cep, rua, numero, bairro, cidade, estado) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
    const valuesCadastrarCliente = [nome, email, cpf, cep, rua, numero, bairro, cidade, estado];
    await conexao.query(queryCadastrarCliente, valuesCadastrarCliente);

    res.status(201).json({ mensagem: 'Cliente cadastrado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar cliente.' });
  }
});

// Editar dados do cliente
router.put('/cliente/:id', async (req, res) => {
  try {
    const { nome, email, cpf, cep, rua, numero, bairro, cidade, estado } = req.body;
    const clienteId = req.params.id;

    // Validar se existe cliente para o id enviado como parâmetro na rota
    const queryBuscarCliente = 'SELECT * FROM clientes WHERE id = $1';
    const valuesBuscarCliente = [clienteId];
    const resultadoBuscarCliente = await conexao.query(queryBuscarCliente, valuesBuscarCliente);

    if (resultadoBuscarCliente.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
    }

    // Validar campos obrigatórios
    if (!nome || !email || !cpf) {
      return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    // Verificar se o novo e-mail já existe no banco de dados
    const queryBuscarNovoEmail = 'SELECT * FROM clientes WHERE email = $1 AND id != $2';
    const valuesBuscarNovoEmail = [email, clienteId];
    const resultadoBuscarNovoEmail = await conexao.query(queryBuscarNovoEmail, valuesBuscarNovoEmail);

    if (resultadoBuscarNovoEmail.rows.length > 0) {
      return res.status(400).json({ mensagem: 'O novo e-mail já está sendo usado por outro cliente.' });
    }

    // Verificar se o novo CPF já existe no banco de dados
    const queryBuscarNovoCPF = 'SELECT * FROM clientes WHERE cpf = $1 AND id != $2';
    const valuesBuscarNovoCPF = [cpf, clienteId];
    const resultadoBuscarNovoCPF = await conexao.query(queryBuscarNovoCPF, valuesBuscarNovoCPF);

    if (resultadoBuscarNovoCPF.rows.length > 0) {
      return res.status(400).json({ mensagem: 'O novo CPF já está sendo usado por outro cliente.' });
    }

    // Lógica para atualizar o cliente no banco
    const queryEditarCliente = 'UPDATE clientes SET nome = $1, email = $2, cpf = $3, cep = $4, rua = $5, numero = $6, bairro = $7, cidade = $8, estado = $9 WHERE id = $10';
    const valuesEditarCliente = [nome, email, cpf, cep, rua, numero, bairro, cidade, estado, clienteId];
    await conexao.query(queryEditarCliente, valuesEditarCliente);

    res.json({ mensagem: 'Cliente atualizado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao editar cliente.' });
  }
});

// Listar Clientes
router.get('/cliente', async (req, res) => {
    try {
      // Listar todos os clientes cadastrados
      const queryListarClientes = 'SELECT * FROM clientes';
      const resultadoListarClientes = await conexao.query(queryListarClientes);
  
      res.json(resultadoListarClientes.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: 'Erro ao listar clientes.' });
    }
  });
  
  // Detalhar Cliente
  router.get('/cliente/:id', async (req, res) => {
    try {
      const clienteId = req.params.id;
  
      // Validar se existe cliente para o id enviado como parâmetro na rota
      const queryDetalharCliente = 'SELECT * FROM clientes WHERE id = $1';
      const valuesDetalharCliente = [clienteId];
      const resultadoDetalharCliente = await conexao.query(queryDetalharCliente, valuesDetalharCliente);
  
      if (resultadoDetalharCliente.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
      }
  
      res.json(resultadoDetalharCliente.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: 'Erro ao detalhar cliente.' });
    }
  });
  
  // Excluir Cliente por ID
  router.delete('/cliente/:id', async (req, res) => {
    try {
      const clienteId = req.params.id;
  
      // Validar se existe cliente para o id enviado como parâmetro na rota
      const queryBuscarCliente = 'SELECT * FROM clientes WHERE id = $1';
      const valuesBuscarCliente = [clienteId];
      const resultadoBuscarCliente = await conexao.query(queryBuscarCliente, valuesBuscarCliente);
  
      if (resultadoBuscarCliente.rows.length === 0) {
        return res.status(404).json({ mensagem: 'Cliente não encontrado.' });
      }
  
      // Lógica para excluir o cliente do banco
      const queryExcluirCliente = 'DELETE FROM clientes WHERE id = $1';
      const valuesExcluirCliente = [clienteId];
      await conexao.query(queryExcluirCliente, valuesExcluirCliente);
  
      res.json({ mensagem: 'Cliente excluído com sucesso!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ mensagem: 'Erro ao excluir cliente.' });
    }
  });
  
  module.exports = router;