import mongoose from "mongoose";
import TelegramBot from "node-telegram-bot-api";

import { URL_MONGO, TOKEN_BOT } from "../../env";
import { spinner, log } from "@clack/prompts";

const s = spinner()

async function connectDatabase(): Promise<void>{
    log.info("Try connect to mongo with this url:" + URL_MONGO);
    
    s.start("Connecting database");
    try {
        await mongoose.connect(URL_MONGO);
    } catch (err){
        s.error("Failed connect to mongo, details: " + err);
        process.exit(1);
    }

    s.stop("Connected database");
    
}

async function connectBot(options: TelegramBot.ConstructorOptions = {}): Promise<TelegramBot>{
    let bot: TelegramBot;

    s.start("Connecting bot");
    try {
        bot = new TelegramBot(TOKEN_BOT, options);
    } catch (err){
        s.error("Failed connect to bot, details: " + err);
        process.exit(1);
    }

    s.stop("Connected bot");

    return bot;
}

export default {
    connectBot,
    connectDatabase
}