import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // needed if you read message text
    GatewayIntentBits.GuildMembers,   // optional, only if you track member events
    GatewayIntentBits.GuildMessageReactions // optional, for reactions
  ]
});


const CHANNEL_ID = process.env.CHANNEL_ID;
const API_URL = process.env.API_URL;

client.on("ready", () => console.log(`Logged in as ${client.user.tag}`));

client.on("messageCreate", async message => {
  if (message.channel.id !== CHANNEL_ID || message.author.bot) return;
  if (!message.attachments.size) return;

  const file = message.attachments.first();

  try {
    const response = await fetch(file.url);
    const buffer = await response.arrayBuffer();
    const tempFilePath = `./uploads/${Date.now()}_${file.name}`;
    fs.writeFileSync(tempFilePath, Buffer.from(buffer));

    const form = new FormData();
    form.append("username", message.author.tag);
    form.append("content", message.content || "");
    form.append("file", fs.createReadStream(tempFilePath));

    await fetch(`${API_URL}/upload`, { method: "POST", body: form });
    fs.unlinkSync(tempFilePath);
  } catch (err) {
    console.error(err);
  }
});

client.login(process.env.BOT_TOKEN);
