require("dotenv").config({ quiet: true });
const { TelegramBot } = require("node-telegram-bot-api");

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
    "/creator — отправляет ФИО автора бота";
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
  bot.sendMessage(chatId, "Пипченко Николай Александрович"); 
});

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

console.log("Telegram-бот запущен и ожидает сообщений...");