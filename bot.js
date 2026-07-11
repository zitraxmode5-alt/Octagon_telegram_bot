require("dotenv").config({ quiet: true });
const { TelegramBot } = require("node-telegram-bot-api");
const pool = require("./db");

// Токен берётся из файла .env (переменная TELEGRAM_BOT_TOKEN),
// чтобы не хранить его в коде и не публиковать на GitHub
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error(
    "Ошибка: не найден TELEGRAM_BOT_TOKEN. Создайте файл .env и укажите в нём токен бота (см. .env.example)."
  );
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Регистрируем список команд в меню бота (кнопка "/" в Telegram).
// Telegram допускает в именах команд только латиницу в нижнем регистре, цифры и "_",
// поэтому "deleteItem" / "getItemByID" зарегистрированы как "deleteitem" / "getitembyid".
bot
  .setMyCommands([
    { command: "start", description: "Начать диалог с ботом" },
    { command: "help", description: "Список команд с описанием" },
    { command: "site", description: "Ссылка на сайт Октагона" },
    { command: "creator", description: "ФИО автора бота" },
    { command: "randomitem", description: "Случайный предмет из БД" },
    { command: "deleteitem", description: "Удалить предмет по ID: /deleteitem 3" },
    { command: "getitembyid", description: "Найти предмет по ID: /getitembyid 3" },
  ])
  .catch((err) => {
    console.error("Не удалось зарегистрировать меню команд:", err.message);
  });

// Форматирует запись из таблицы Items в строку вида "(id) - name: desc"
function formatItem(item) {
  return `(${item.id}) - ${item.name}: ${item.desc}`;
}

// Приветствие в начале диалога (команда /start)
bot.onText(/^\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Привет, октагон!");
});

// Команда /help — список остальных команд с описанием
bot.onText(/^\/help/, (msg) => {
  const chatId = msg.chat.id;
  const text =
    "Доступные команды:\n\n" +
    "/site — отправляет ссылку на сайт Октагона\n" +
    "/creator — отправляет ФИО автора бота\n" +
    "/randomitem — случайный предмет из БД\n" +
    "/deleteitem <id> — удаляет предмет по ID, например: /deleteitem 3\n" +
    "/getitembyid <id> — находит предмет по ID, например: /getitembyid 3";
  bot.sendMessage(chatId, text);
});

// Команда /site — ссылка на сайт Октагона
bot.onText(/^\/site/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "https://octagon-students.ru/");
});

// Команда /creator — ФИО автора бота
bot.onText(/^\/creator/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Пипченко Николай"); // Замените на своё полное ФИО
});

// Команда /randomitem — возвращает случайный предмет из БД
bot.onText(/^\/randomitem/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const [rows] = await pool.query("SELECT * FROM Items ORDER BY RAND() LIMIT 1");
    if (rows.length === 0) {
      return bot.sendMessage(chatId, "В базе данных пока нет ни одного предмета.");
    }
    bot.sendMessage(chatId, formatItem(rows[0]));
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Ошибка при обращении к базе данных.");
  }
});

// Команда /deleteitem <id> — удаляет предмет по ID
bot.onText(/^\/deleteitem(?:@\w+)?(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const id = match[1];

  if (!id) {
    return bot.sendMessage(chatId, "Ошибка");
  }

  try {
    const [result] = await pool.query("DELETE FROM Items WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      bot.sendMessage(chatId, "Ошибка");
    } else {
      bot.sendMessage(chatId, "Удачно");
    }
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Ошибка");
  }
});

// Команда /getitembyid <id> — возвращает предмет по ID
bot.onText(/^\/getitembyid(?:@\w+)?(?:\s+(\d+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const id = match[1];

  if (!id) {
    return bot.sendMessage(chatId, "Укажите ID, например: /getitembyid 3");
  }

  try {
    const [rows] = await pool.query("SELECT * FROM Items WHERE id = ?", [id]);
    if (rows.length === 0) {
      return bot.sendMessage(chatId, "Предмет с таким ID не найден.");
    }
    bot.sendMessage(chatId, formatItem(rows[0]));
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "Ошибка при обращении к базе данных.");
  }
});

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

console.log("Telegram-бот запущен и ожидает сообщений...");
