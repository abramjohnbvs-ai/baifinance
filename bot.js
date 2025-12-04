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

// Keyword mapping (single source of truth)
const ACTIONS = {
  TIME_IN: ["time in", "back", "in"],
  TIME_OUT: ["time out", "brb", "lunch", "out"],
};

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!ALLOWED_CHANNELS.includes(message.channel.id)) return;

  const content = message.content.toLowerCase();
  const username = message.member?.displayName || message.author.username;
  const userId = message.author.id;

  // Detect action
  let action = null;

  for (const phrase of ACTIONS.TIME_IN) {
    if (content === phrase || content.startsWith(`${phrase} `)) {
      action = "Time In";
      break;
    }
  }

  if (!action) {
    for (const phrase of ACTIONS.TIME_OUT) {
      if (content === phrase || content.startsWith(`${phrase} `)) {
        action = "Time Out";
        break;
      }
    }
  }

  if (!action) return;

  // Validation & state update
  const currentStatus = userStatus[userId] || "out";

  if (action === "Time Out" && currentStatus === "out") {
    return message.reply(`⚠️ ${username} is already timed out.`);
  }

  userStatus[userId] = action === "Time In" ? "in" : "out";

  // Webhook request
  try {
    await axios.post(process.env.MAKE_WEBHOOK_URL, {
      user: username,
      user_id: userId,
      content: action, // ✅ standardized value
    });

    await message.reply(`✅ ${username}'s ${action} has been recorded.`);
  } catch (error) {
    console.error("❌ Failed to send to Make:", error.message);
    await message.reply("⚠️ Something went wrong sending your record.");
  }
});

client.login(process.env.DISCORD_TOKEN);
