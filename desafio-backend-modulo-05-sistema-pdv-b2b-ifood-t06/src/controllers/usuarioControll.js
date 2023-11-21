const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const conexao = require('../conexao/conection');

// ... (outras importações e configurações)

// Middleware para validar o token de autenticação
const autenticacaoMiddleware = require('./autenticacaoMiddleware');

const router = express.Router();


/*=====================CADASTRAR USUARIO============*/
router.post('/cadastrarUsuario', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    // Validar campos, verificar se email já existe, etc.
    if (!nome || !email || !senha) {
      return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos.' });
    }

    // Verificar se o usuário já existe no banco de dados
    const queryBuscarUsuario = 'SELECT * FROM usuarios WHERE email = $1';
    const valuesBuscarUsuario = [email];
    const resultadoBuscarUsuario = await conexao.query(queryBuscarUsuario, valuesBuscarUsuario);

    if (resultadoBuscarUsuario.rows.length > 0) {
      return res.status(400).json({ mensagem: 'Usuário já cadastrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // Lógica para salvar o usuário no banco ou na conexão de sua escolha
    // Por exemplo, utilizando a conexão diretamente
    const queryCadastrarUsuario = 'INSERT INTO usuarios (nome, email, senha) VALUES ($1, $2, $3)';
    const valuesCadastrarUsuario = [nome, email, senhaHash];
    await conexao.query(queryCadastrarUsuario, valuesCadastrarUsuario);

    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
  }
});


/*===========EFETUAR LOGIN==========*/
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    // Validar campos, buscar usuário no banco, etc.

    // Lógica para buscar usuário no banco
    const queryBuscarUsuario = 'SELECT * FROM usuarios WHERE email = $1';
    const valuesBuscarUsuario = [email];
    const resultadoBuscarUsuario = await conexao.query(queryBuscarUsuario, valuesBuscarUsuario);

    const usuario = resultadoBuscarUsuario.rows[0];

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(400).json({ mensagem: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ usuarioId: usuario.id }, 'chave-secreta-do-jwt', {
      expiresIn: '1h',
    });

    res.json({ mensagem: 'Login bem-sucedido!', token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao fazer login.' });
  }
});

/*===================DETALHAR PERFIL=================*/
router.get('/usuario/:id', async (req, res) => {
  try {
    const id = req.params.id;

    if (!id) {
      return res.status(400).json({ mensagem: 'ID do usuário não fornecido.' });
    }

    const query = 'SELECT * FROM usuarios WHERE id = $1';
    const values = [id];

    const resultado = await conexao.query(query, values);

    if (resultado.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    const usuario = resultado.rows[0];

    const dadosUsuario = {
      nome: usuario.nome,
      email: usuario.email,
      // Mais campos do usuário
    };

    res.json(dadosUsuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao detalhar perfil.' });
  }
});

/*==============EDITAR PERFIL============*/
router.put('/usuario/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nome, email, senha } = req.body;

    // Validar campos, verificar se email já existe, etc.
    if (!nome || !email) {
      return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos obrigatórios.' });
    }

    const queryBuscarUsuarioPorId = 'SELECT * FROM usuarios WHERE id = $1';
    const valuesBuscarUsuarioPorId = [id];
    const resultadoBuscarUsuarioPorId = await conexao.query(queryBuscarUsuarioPorId, valuesBuscarUsuarioPorId);

    if (resultadoBuscarUsuarioPorId.rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    // Verificar se o novo email já está sendo utilizado por outro usuário
    const queryBuscarUsuarioPorEmail = 'SELECT * FROM usuarios WHERE email = $1 AND id != $2';
    const valuesBuscarUsuarioPorEmail = [email, id];
    const resultadoBuscarUsuarioPorEmail = await conexao.query(queryBuscarUsuarioPorEmail, valuesBuscarUsuarioPorEmail);

    if (resultadoBuscarUsuarioPorEmail.rows.length > 0) {
      return res.status(400).json({ mensagem: 'E-mail já cadastrado por outro usuário.' });
    }

    const queryAtualizarUsuario = 'UPDATE usuarios SET nome = $1, email = $2, senha = $3 WHERE id = $4';
    const valuesAtualizarUsuario = [nome, email, senha, id];
    await conexao.query(queryAtualizarUsuario, valuesAtualizarUsuario);

    res.json({ mensagem: 'Perfil atualizado com sucesso.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao atualizar perfil.' });
  }
});

/*==============EFETUAR DEPLOY==============*/
router.post('/efetuarDeploy', async (req, res) => {
  try {
    // Lógica para efetuar deploy (ex: subir a aplicação para um servidor)
    // Você pode utilizar ferramentas como Heroku, Netlify, AWS, etc.

    res.json({ mensagem: 'Aplicação deployada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao efetuar deploy.' });
  }
});

module.exports = router;

