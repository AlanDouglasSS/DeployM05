const express = require('express');
const app = express();
const usuarioRoutes = require('./controllers/usuarioControll.js');
const categoriaRoutes = require('./controllers/categoriaControll.js');
const produtoRoutes = require('./controllers/produtoControll.js');
const clienteRouter = require('./controllers/clienteControll.js');
const pedidoRouter = require('./controllers/pedidoControll.js')

app.use(express.json());

// Utilize as rotas de usuário definidas no arquivo usuarioControll.js
app.use(usuarioRoutes);

// Utilize as rotas de categoria definidas no arquivo categoriaControll.js
app.use(categoriaRoutes);

app.use(produtoRoutes);

app.use(clienteRouter);

app.use(pedidoRouter);

// Outras rotas...
// app.use(outrasRotas);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor em execução na porta ${PORT}`);
});

