const pkg = require("../package.json");

module.exports = {
  applicationName: pkg.name,
  mysql: {
    options: {
      host: "us-cdbr-east-03.cleardb.com",
      database: "heroku_4040d8911348aca",
      user: "be2b5e641b70be",
      password: "70f3c16d"
    },
    client: null,
  },
};
