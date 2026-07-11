const express = require("express");

const app = express();
const PORT = 3000;

// При переходе по http://localhost:3000/ сервер вернёт заголовок
app.get("/", (req, res) => {
  res.send("<h1>Привет, Октагон!</h1>");
});

app.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}/`);
});
