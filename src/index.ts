import _ from "lodash";
import mongoose from "mongoose";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "./lib/logger";
import listenersBot from "./bot";
import cronPoll from "./cron/cronPoll";
import cronWeather from "./cron/cronWeather";
import { URL_MONGO, TOKEN_BOT } from "./env";
import versionUtils from "./utils/versionUtils";
import cronEndOfYear from "./cron/cronEndOfYear";

const logger = Logger("main");

async function main(){

    logger.info("Current timezone:", DateTime.local().zoneName);

    //mongo
    logger.debug("Try connect to mongo with this url: "+URL_MONGO);
    try {
        await mongoose.connect(URL_MONGO);
    } catch (err){
        logger.error("Failed connect to mongo, details:", err);
        process.exit(1);
    }
    logger.info("Mongo connected!");

    //versioning management
    await versionUtils.main();
    
    //telegram
    let bot: TelegramBot;
    try {
        bot = new TelegramBot(TOKEN_BOT, {
            polling: {
                autoStart: true,
                params: {
                    allowed_updates: ["message", "new_chat_title", "poll_answer"]
                }
            }
        });
    } catch (err){
        logger.error("Error telegram bot, details:", err);
        process.exit(1);
    }
    logger.info("Bot connected!");

    listenersBot(bot);
    cronWeather(bot);
    cronPoll(bot);
    cronEndOfYear(bot);
}

try {
    await main();
} catch (err){
    logger.error("Generic error not handled, details:", err);
}