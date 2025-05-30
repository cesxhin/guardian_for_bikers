import TelegramBot from "node-telegram-bot-api";
import { TOKEN_BOT, URL_MONGO, USERNAME_BOT } from "./env";
import _ from "lodash";
import Logger from "./lib/logger";
import mongoose from "mongoose";
import listenersBot from "./bot";
import cronWeather from "./cron/cronWeather";
import { DateTime } from "luxon";

export let bot: TelegramBot;

const logger = Logger("main");

if (_.isNil(TOKEN_BOT)){
    logger.error("Missing token bot");
    process.exit(1);
}

if (_.isNil(USERNAME_BOT)){
    logger.error("Missing username bot");
    process.exit(1);
}

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

    //telegram
    try {
        bot = new TelegramBot(TOKEN_BOT, { polling: true });
    } catch (err){
        logger.error("Error telegram bot, details:", err);
        process.exit(1);
    }

    listenersBot(bot);
    cronWeather(bot);
}

try {
    await main();
} catch (err){
    logger.error("Generic error not handled, details:", err);
}