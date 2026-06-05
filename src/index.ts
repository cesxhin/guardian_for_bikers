import axios from "axios";
import mongoose from "mongoose";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "./lib/logger.ts";
import listenersBot from "./bot.ts";
import cronPoll from "./cron/cronPoll.ts";
import cronWeather from "./cron/cronWeather.ts";
import { URL_MONGO, TOKEN_BOT } from "./env.ts";
import versionUtils from "./utils/versionUtils.ts";
import cronEndOfYear from "./cron/cronEndOfYear.ts";

const logger = Logger("main");
const loggerAxios = Logger("axios");

//axios
axios.interceptors.request.use((config) => {
    loggerAxios.info(`Request: ${config.url}, params: ${JSON.stringify(config.params || {})}`);

    return config;
});
axios.interceptors.response.use((response) => {
    loggerAxios.info(`Response: ${response.config.url}, params: ${JSON.stringify(response.config.params || {})} ${response.status}`);
    
    return response;
});

//main
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

    bot.on("polling_error", async (error) => {
        logger.error("Failed polling, details:", error);

        await bot.stopPolling();

        logger.warn("Stop polling and wait for 5 seconds before retry reconntect");

        await new Promise<void>((resolve) => setTimeout(resolve, 5000));

        await bot.startPolling();

        try {
            await bot.getMe();

            logger.info("Bot reconnected!");
        } catch {
            //ignore
        }
    });

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