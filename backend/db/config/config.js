require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

module.exports = {
  development: {
    username       : process.env.DB_USERNAME,
    password       : process.env.DB_PASSWORD,   // never hardcode — use .env
    database       : process.env.DB_NAME,
    host           : process.env.DB_HOST        || "127.0.0.1",
    port           : process.env.DB_PORT        || 5432,
    timezone       : "+05:30",
    dialect        : "postgres",
    dialectOptions : {
      useUTC: false,
      ssl: {
        require            : true,
        rejectUnauthorized : false,
      },
    },
  },
  test: {
    username       : process.env.DB_USERNAME    || "postgres",
    password       : process.env.DB_PASSWORD    || null,
    database       : process.env.DB_NAME        || "database_test",
    host           : process.env.DB_HOST        || "127.0.0.1",
    port           : process.env.DB_PORT        || 5432,
    dialect        : "postgres",
    dialectOptions : { useUTC: false },
  },
  production: {
    username       : process.env.DB_USERNAME,
    password       : process.env.DB_PASSWORD,
    database       : process.env.DB_NAME,
    host           : process.env.DB_HOST,
    port           : process.env.DB_PORT        || 5432,
    timezone       : "+05:30",
    dialect        : "postgres",
    dialectOptions : {
      useUTC: false,
      ssl: {
        require            : true,
        rejectUnauthorized : false,
      },
    },
  },
};
