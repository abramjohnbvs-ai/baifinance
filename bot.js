require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const axios = require("axios");

// random port just to satisfy Render
const http = require("http");

const PORT = process.env.PORT || 3000; // Render provides process.env.PORT
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

// Discord bot
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

// Debugging: log every message the bot sees
client.on(Events.MessageCreate, async (message) => {
  console.log(
    `[${message.guild?.name || "DM"}] ${message.author.tag}: ${message.content}`
  );

  if (message.author.bot) return;

  const keywords = ["time in", "time out", "brb", "back", "lunch"];
  if (keywords.some((k) => message.content.toLowerCase().includes(k))) {
    await axios.post(process.env.MAKE_WEBHOOK_URL, {
      user: message.member?.displayName || message.author.username,
      user_id: message.author.id,
      content: message.content,
    });

    const username = message.member?.displayName || message.author.username;
    await message.reply(`✅ ${username}'s time has been recorded`);
  }
});

client.login(process.env.DISCORD_TOKEN);
