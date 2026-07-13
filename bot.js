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
    "/getitembyid <id> — находит предмет по ID, например: /getitembyid 3\n" +
    "!qr <текст/ссылка> — отправляет QR-код, например: !qr https://example.com\n" +
    "!webscr <адрес сайта> — отправляет скриншот сайта, например: !webscr example.com";
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

// Команда !qr <текст/ссылка> — генерирует и отправляет QR-код
// Используется бесплатный внешний сервис api.qrserver.com (без API-ключа)
bot.onText(/^!qr\s+(.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const data = match[1].trim();

  if (!data) {
    return bot.sendMessage(
      chatId,
      "Укажите текст или ссылку, например: !qr https://example.com"
    );
  }

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    data
  )}`;

  bot.sendPhoto(chatId, qrUrl).catch((err) => {
    console.error(err);
    bot.sendMessage(chatId, "Не удалось сгенерировать QR-код.");
  });
});

// Команда !webscr <адрес сайта> — делает и отправляет скриншот сайта
// Используется бесплатный сервис mshots от WordPress.com (без API-ключа)
bot.onText(/^!webscr\s+(.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  let url = match[1].trim();

  if (!url) {
    return bot.sendMessage(
      chatId,
      "Укажите адрес сайта, например: !webscr https://example.com"
    );
  }

  // Добавляем протокол, если пользователь его не указал
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }

  const screenshotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(
    url
  )}?w=1024&h=768`;

  bot.sendPhoto(chatId, screenshotUrl).catch((err) => {
    console.error(err);
    bot.sendMessage(chatId, "Не удалось получить скриншот сайта.");
  });
});

bot.on("polling_error", (err) => {
  console.error("Polling error:", err.message);
});

console.log("Telegram-бот запущен и ожидает сообщений...");