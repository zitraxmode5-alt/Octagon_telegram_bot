const mysql = require("mysql2/promise");

// Настройки подключения к вашей локальной БД (XAMPP / phpMyAdmin)
// По умолчанию в XAMPP: пользователь "root", пароль пустой ("")
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "ChatBotTests",
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
