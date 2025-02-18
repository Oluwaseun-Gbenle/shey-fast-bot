require("dotenv").config();
const express = require('express');
const app = express();
const TelegramBot = require("node-telegram-bot-api");
//const { OpenAI } = require("openai"); // Import OpenAI SDK
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Create a bot that uses 'polling' to fetch new updates
const token = process.env.TELEGRAM_BOT_TOKEN;
const STICKER_ID = "CAACAgIAAxkBAAJ4HGez0kCxSUV7iDWZPtKcfSpJTd9WAAKDDwAC5Kv5S5tVIDVDbwcPNgQ";
const bot = new TelegramBot(token, { polling: true });
const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(geminiApiKey);
const botName = "sheyfastbot";

// To store the state of trivia and joke
let isTriviaActive = false;
let isReminderActive = true;
let isQuotesActive = true;
let intervals = {};

// Function to send reminders and quotes at intervals
function sendIntervalMessages(chatId) {
    if (intervals[chatId]) {
      clearIntervals(chatId); // Clear existing intervals first
    }
  
    // Send reminders at intervals (every 1 minute)
    const reminderInterval = setInterval(() => {
      if (isReminderActive) {
        const reminder = reminders[Math.floor(Math.random() * reminders.length)];
        bot.sendMessage(chatId, reminder);
        bot.sendMessage(chatId, "Type /stopReminders to stop reminders.");
      }
    }, 43200000);
  
    // Send quotes at intervals (every 2 minutes)
    const quoteInterval = setInterval(() => {
      if (isQuotesActive) {
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        bot.sendMessage(chatId, quote);
        bot.sendMessage(chatId, "Type /stopQuotes to stop quotes");
      }
    }, 3600000);
  
    // Store intervals for this chat
    intervals[chatId] = { reminderInterval, quoteInterval };
  }
  
  function clearIntervals(chatId) {
    if (intervals[chatId]) {
      clearInterval(intervals[chatId].reminderInterval);
      clearInterval(intervals[chatId].quoteInterval);
      delete intervals[chatId];
    }
  }
// Start command
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const username = msg.from.first_name || "friend"; 

  clearIntervals(chatId); // Clear any existing intervals
  sendIntervalMessages(chatId); // Start new intervals

  // Send a hello sticker
  bot.sendSticker(chatId, STICKER_ID).then(() => {
    // Send the greeting message after the sticker
    bot.sendMessage(chatId, `${username}, hello!😉\n\nMy name is ${"Shey Bot"}, you can talk to me here and in Telegram groups!`);

    // Send another message about adding to groups
    setTimeout(() => {
      bot.sendMessage(chatId, `Add me to any group chat 🦢🦜🐦!\n\n1) I'll write only when mentioned "@${botName}" or when someone replies to me.`);
    }, 2000); // Sends after 2 seconds

    setTimeout(() => {
      bot.sendMessage(chatId, `2) And yes... if you'd like, I can sometimes take the initiative to keep the group dynamics lively! 😀😀`);
    }, 4000);

    setTimeout(() => {
      bot.sendMessage(chatId, `⚙️ By the way! For trivia click: /trivia, for jokes: /joke and /commands for all commands`);
    }, 6000);
  });
});

bot.onText(/\/settings/, (msg) => {
  const chatId = msg.chat.id;

  // Send settings options with inline keyboard
  bot.sendMessage(chatId, "🔧 Choose a setting to modify:", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📝 Change Name", callback_data: "change_name" }],
        [{ text: "🔔 Notification Settings", callback_data: "notifications" }],
        [{ text: "⬅️ Back", callback_data: "back_to_main" }],
      ],
    },
  });
});

// Handle button clicks for settings options
bot.on("callback_query", (callbackQuery) => {
  const message = callbackQuery.message;
  const chatId = message.chat.id;

  let reply = "";
  if (callbackQuery.data === "change_name") {
    reply = "📝 You can change your name here.";
  } else if (callbackQuery.data === "notifications") {
    reply = "🔔 Adjust your notification settings here.";
  } else if (callbackQuery.data === "back_to_main") {
    reply = "Returning to main settings menu...";
  }

  if (reply) bot.sendMessage(chatId, reply);
  bot.answerCallbackQuery(callbackQuery.id);
});


const jokes = [
  "Why don't skeletons fight each other? They don't have the guts! 😂",
  "I told my computer I needed a break, and now it’s frozen. 😆",
  "Why was the math book sad? Because it had too many problems! 😄",
];

bot.onText(/\/joke/, (msg) => {
  const chatId = msg.chat.id;
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    bot.sendMessage(chatId, joke);
});

const reminders = [
  "Don't forget to take a break and stay hydrated! 💧",
  "Remember to stretch every hour! 🧘‍♂️",
  "It's a great time for a coffee or tea! ☕",
];

const quotes = ["Believe in yourself! 💪", "Every day is a fresh start. 🌞", "Keep going, you’re doing great! 🌟"];


bot.onText(/\/exit/, (msg) => {
  const chatId = msg.chat.id;
  isTriviaActive = false;
  bot.sendMessage(chatId, "Trivia game exited. Type /trivia to play again!");
});

bot.onText(/\/stopReminders/, (msg) => {
    const chatId = msg.chat.id;
    isReminderActive = false;
   !isReminderActive && bot.sendMessage(chatId, "reminders have been stopped. Type /resumeReminders to continue.");
  });

  bot.onText(/\/stopQuotes/, (msg) => {
    const chatId = msg.chat.id;
    isQuotesActive = false;
    !isQuotesActive && bot.sendMessage(chatId, "quotes have been stopped. Type /resumeQuotes to continue.");
  });

  bot.onText(/\/resumeReminders/, (msg) => {
    const chatId = msg.chat.id;
    isReminderActive = true;
    isReminderActive && bot.sendMessage(chatId, "reminders have been resumed. Type /stopReminders to stop.");
  });

  bot.onText(/\/resumeQuotes/, (msg) => {
    const chatId = msg.chat.id;
    isQuotesActive = true;
    isQuotesActive && bot.sendMessage(chatId, "quotes have been resumed. Type /stopQuotes to stop.");
  });

  const questions = [
    { 
      question: "What is the capital of France?", 
      answers: ["paris", "paris, france"]
    },
    { 
      question: "Who wrote 'Harry Potter'?", 
      answers: ["j.k. rowling", "rowling", "jk rowling", "joanne rowling"]
    },
    { 
      question: "What is 5 + 7?", 
      answers: ["12", "twelve"]
    }
  ];
  
  function checkAnswer(userAnswer, correctAnswers) {
    const normalizedUserAnswer = userAnswer.toLowerCase().trim();
    return correctAnswers.some(answer => 
      normalizedUserAnswer === answer || 
      normalizedUserAnswer.includes(answer)
    );
  }
  
  bot.onText(/\/trivia/, (msg) => {
    const chatId = msg.chat.id;
    isTriviaActive = true;
    sendTrivia(chatId);
  });
  
  function sendTrivia(chatId) {
    if (isTriviaActive) {
      const question = questions[Math.floor(Math.random() * questions.length)];
      bot.sendMessage(chatId, `🎮 Trivia Time: ${question.question}`);
      bot.sendMessage(chatId, "Type /exit to exit trivia.");
      
      const messageHandler = (response) => {
        if (response.chat.id === chatId) {
          if (response.text === "/exit") {
            isTriviaActive = false;
            bot.sendMessage(chatId, "Trivia game exited. Type /trivia to play again!");
            bot.removeListener("message", messageHandler);
          } else if (checkAnswer(response.text, question.answers)) {
            bot.sendMessage(chatId, "🎉 Correct!");
            bot.removeListener("message", messageHandler);
            setTimeout(() => {
              sendTrivia(chatId);
            }, 2000);
          } else {
            bot.sendMessage(chatId, "😬 Incorrect! Try again!");
          }
        }
      };
      
      bot.on("message", messageHandler);
    }
  }
  


bot.onText(/\/commands/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Here are all the commands I can help with:\n\n" +
      "/start - Begin chatting with me\n" +
      "/resumeReminders - Start  reminders\n" +
      "/resumeQuotes - Start Quotes\n" +
      "/trivia - Start trivia\n" +
      "/stopQuotes - Stop Quotes\n" +
      "/stopReminders - Stop Reminders\n" +
      "/joke - Hear a joke");
  });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const userMessage = msg.text;
  const username = msg.from.first_name || "friend";

  // Ignore bot messages & commands (except /start)
  if (msg.from.is_bot || userMessage.startsWith("/")) return;

  console.log(`Received message: "${userMessage}" from chatId: ${chatId}`);
  if (!isTriviaActive) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    // Modify AI prompt to make it act like "sheyfastbot"
    const aiPrompt = `
    You are ${botName}, a friendly and helpful Telegram bot.
    Your job is to assist users in chats and groups in a fun and engaging way.
    Always mention the user's first name at the beginning of your responses.
    Keep your tone friendly, conversational, and a bit playful when needed.
    Example conversation:
    User: "Tell me a joke!"
    be careful not to mention any other username except ${username}
    You: "Haha, ${username}, okay! Why did the chicken join Telegram? To get to the other side of the chat! 😂"
    Now, respond to this: "${userMessage}"
  `;

    const result = await model.generateContent(aiPrompt);
    const response = await result.response;

    const botReply = response.text();

    // Send AI-generated response with user's name
    bot.sendMessage(chatId, `${username}, ${botReply}`);
  } catch (error) {
    console.error("AI Error:", error); // Log the actual error
    bot.sendMessage(chatId, "⚠️ Oops! My AI brain seems to be having a hiccup. Try again in a bit!");
  }
}
});

// Echo any message sent to the bot
// bot.on("message", (msg) => {
//     if (msg.text !== "/start") {
//         bot.sendMessage(msg.chat.id, `You said: ${msg.text}`);
//     }
// });

app.get('/', (req, res) => {
  res.send('Bot is running!');
});

// Add this at the bottom of your file
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




