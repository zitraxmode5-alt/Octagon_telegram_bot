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
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Привет, октагон!");
});

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

console.log("Telegram-бот запущен и ожидает сообщений...");
