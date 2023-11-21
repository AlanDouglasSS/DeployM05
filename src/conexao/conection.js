const { Pool } = require('pg');

const conexao = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '123',  
  database: 'pdv',
    
});

module.exports = conexao;
