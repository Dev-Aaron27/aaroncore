import { Client, GatewayIntentBits } from "discord.js";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";
import dotenv from "dotenv";
dotenv.config();

// -----------------------------
// Create Discord Client
// -----------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required to read message text
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ]
});

const CHANNEL_ID = process.env.CHANNEL_ID;
const API_URL = process.env.API_URL;

// -----------------------------
// On bot ready
// -----------------------------
client.on("ready", () => {
  console.log(`Aaron Core Bot logged in as ${client.user.tag}`);
});

// -----------------------------
// Track messages
// -----------------------------
client.on("messageCreate", async (message) => {
  // Ignore bots & other channels
  if (message.author.bot) return;
  if (message.channel.id !== CHANNEL_ID) return;

  try {
    let filePath = null;

    // If message has attachments (images/files)
    if (message.attachments.size > 0) {
      const file = message.attachments.first();
      const response = await fetch(file.url);
      const buffer = await response.arrayBuffer();
      filePath = `./uploads/${Date.now()}_${file.name}`;
      fs.writeFileSync(filePath, Buffer.from(buffer));
    }

    // Prepare form data
    const form = new FormData();
    form.append("username", message.author.tag);
    form.append("content", message.content || "");
    if (filePath) form.append("file", fs.createReadStream(filePath));

    // Send to API
    await fetch(`${API_URL}/upload`, { method: "POST", body: form });

    // Delete temp file
    if (filePath) fs.unlinkSync(filePath);

    console.log(`Tracked message from ${message.author.tag}`);
  } catch (err) {
    console.error("Failed to upload message:", err);
  }
});

// -----------------------------
// Login
// -----------------------------
client.login(process.env.BOT_TOKEN);
