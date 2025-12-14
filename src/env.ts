import fs from "fs";
import _ from "lodash";
import Logger from "./lib/logger";

const logger = Logger("env");

//load env
if (fs.existsSync(".env")){
    try {
        process.loadEnvFile();
    } catch(err){
        logger.error("Failed read .env, details:", err);
    }
}

if (_.isNil(process.env.TOKEN_BOT)){
    logger.error("Missing token bot");
    process.exit(1);
}

if (_.isNil(process.env.USERNAME_BOT)){
    logger.error("Missing username bot");
    process.exit(1);
}

//-- BOT --
export const TOKEN_BOT = process.env.TOKEN_BOT;
export const USERNAME_BOT = process.env.USERNAME_BOT;

//-- MONGO --
export const URL_MONGO = process.env.URL_MONGO || "mongodb://127.0.0.1:27017/guards_for_bikers";

// -- VERSION DB --
export const VERSION_CURRENT_DB = 2;

// -- CRON --
export const CRON_WEATHER = process.env.CRON_WEATHER || "0 * * * *"; //every hour;
export const CRON_POLL = process.env.CRON_POLL || "*/5 * * * *"; //Every 5 minutes


// -- CACHE USERS --
export const USERS_EXPIRE_SECONDS = parseInt(process.env.USERS_EXPIRE_SECONDS || "") || 10800; //3 hours;

// -- CACHE POLLS --
export const POLLS_EXPIRE_SECONDS = parseInt(process.env.POLLS_EXPIRE_SECONDS || "") || 3900; //1 hour and 5minutes;

// -- SETTINGS POLLS --
export const POLLS_EXPIRE_QUESTION_SECONDS = parseInt(process.env.POLLS_EXPIRE_QUESTION_SECONDS || "") || 3600 * 2; //2 hour
export const POLLS_EXPIRE_ACTION_SECONDS = parseInt(process.env.POLLS_EXPIRE_ACTION_SECONDS || "") || 3600 * 10; //10 hour
export const POLLS_EXPIRE_IMPOSTOR_SECONDS = parseInt(process.env.POLLS_EXPIRE_ACTION_SECONDS || "") || 3600 * 10; //10 hour