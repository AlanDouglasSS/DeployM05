const jwt = require('jsonwebtoken');

// Função de middleware para verificar a autenticação do usuário
function autenticacaoMiddleware(req, res, next) {
  // Verifica se o usuário está autenticado via sessão
  if (req.session && req.session.user) {
    // O usuário está autenticado via sessão, então podemos prosseguir para a próxima rota
    return next();
  }

  // Verifica se o token JWT está presente nos cabeçalhos da requisição
  const authorizationHeader = req.headers.authorization;

  if (authorizationHeader) {
    const token = authorizationHeader.split(' ')[1];

    try {
      // Verifica se o token é válido e decodifica o payload
      const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use a variável de ambiente para armazenar a chave secreta do JWT

      // Adiciona o usuário autenticado ao objeto `req` para uso posterior
      req.user = decoded.user;

      // O usuário está autenticado via token JWT, então podemos prosseguir para a próxima rota
      return next();
    } catch (err) {
      // O token é inválido ou expirou, retorna um erro 401
      return res.status(401).json({ message: 'Token inválido' });
    }
  }

  // O usuário não está autenticado, redireciona para a página de login (ou retorna um erro 401)
  res.status(401).json({ message: 'Não autenticado' }); // Pode redirecionar para o login se preferir
}

module.exports = autenticacaoMiddleware;