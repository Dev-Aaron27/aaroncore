import { fork } from "child_process";

// Start server
fork("server.js");

// Start Discord bot
fork("bot.js");
