require("dotenv/config");
const { Pool } = require("pg");

const DB = new Pool();

DB.connect()
  .then(() => {
    console.log("Mi Casa Backend: Database Connected");
  })
  .catch((err) => {
    console.error(err);
  });

module.exports = DB;
