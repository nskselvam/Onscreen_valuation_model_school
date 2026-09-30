require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];

console.log('env          :', env);
console.log('user         :', config.username);
console.log('password set :', !!config.password);
console.log('database     :', config.database);
console.log('host         :', config.host);
console.log('port         :', config.port);
console.log('dialect      :', config.dialect);

const { Sequelize } = require('sequelize');
const seq = new Sequelize({ ...config,
  pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
  dialectOptions: { ...config.dialectOptions, connectTimeout: 10000 },
  logging: false,
});

seq.authenticate()
  .then(() => { console.log('\n✅ Sequelize connected successfully'); process.exit(0); })
  .catch((err) => { console.error('\n❌ Sequelize auth failed:', err.message); process.exit(1); });
