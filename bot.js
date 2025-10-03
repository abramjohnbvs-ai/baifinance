require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const axios = require("axios");

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

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const keywords = ["time in", "time out"];
  if (keywords.some((k) => message.content.toLowerCase().includes(k))) {
    await axios.post(process.env.MAKE_WEBHOOK_URL, {
      user: message.author.username,
      user_id: message.author.id,
      content: message.content,
    });

    const username = message.member?.nickname || message.author.username;
    await message.reply(`✅ ${username} has logged in!`);
  }
});

client.login(process.env.DISCORD_TOKEN);
