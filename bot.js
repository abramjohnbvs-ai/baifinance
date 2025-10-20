require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const axios = require("axios");
const http = require("http");

const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("OK");
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Bot is running");
});
server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

// Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`🤖 Logged in as ${c.user.tag}`);
});

// Track user time state in memory
const userStatus = {};
const ALLOWED_CHANNELS = [
  "1429655909428363284", // #attendance
  "914875154541195276", // #general practice
  "1429638437832757272", // #general testing
];

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  if (message.channel.id !== ALLOWED_CHANNEL_ID) return;

  const content = message.content.toLowerCase();
  const username = message.member?.displayName || message.author.username;

  // Supported keywords
  const keywords = ["time in", "time out", "brb", "back", "lunch"];
  const matched = keywords.find((k) => content.includes(k));
  if (!matched) return;

  // Validation logic
  const userId = message.author.id;
  const currentStatus = userStatus[userId] || "out";

  if (matched.includes("time in")) {
    userStatus[userId] = "in";
  }

  if (matched.includes("back")) {
    userStatus[userId] = "in";
  }

  if (matched.includes("time out")) {
    if (currentStatus === "out") {
      return message.reply(`⚠️ ${username} is already timed out.`);
    }
    userStatus[userId] = "out";
  }

  if (matched.includes("brb")) {
    if (currentStatus === "out") {
      return message.reply(`⚠️ ${username} is already timed out.`);
    }
    userStatus[userId] = "out";
  }

  if (matched.includes("lunch")) {
    if (currentStatus === "out") {
      return message.reply(`⚠️ ${username} is already timed out.`);
    }
    userStatus[userId] = "out";
  }

  // Continue with webhook request
  try {
    await axios.post(process.env.MAKE_WEBHOOK_URL, {
      user: username,
      user_id: userId,
      content: message.content,
    });

    await message.reply(`✅ ${username}'s ${matched} has been recorded.`);
  } catch (error) {
    console.error("❌ Failed to send to Make:", error.message);
    await message.reply("⚠️ Something went wrong sending your record.");
  }
});

client.login(process.env.DISCORD_TOKEN);
