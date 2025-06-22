import {config} from "dotenv";
config();

//-- BOT --
export const TOKEN_BOT = process.env.TOKEN_BOT || null;
export const USERNAME_BOT = process.env.USERNAME_BOT || null;

//-- MONGO --
export const URL_MONGO = process.env.URL_MONGO || "mongodb://127.0.0.1:27017/guards_for_bikers";

// -- GENERIC --
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";

// -- VERSION DB --
export const VERSION_CURRENT_DB = 1;

// -- CRON --
export const CRON_WEATHER = process.env.CRON_WEATHER || "0 0 * * * *" //every 12AM;
export const CRON_POLL = process.env.CRON_POLL || "5 * * * *" //At 5 minutes past the hour

// -- CACHE USERS --
export const USERS_EXPIRE_SECONDS = parseInt(process.env.USERS_EXPIRE_SECONDS) || 10800 //3 hours;

// -- CACHE POLLS --
export const POLLS_EXPIRE_SECONDS = parseInt(process.env.POLLS_EXPIRE_SECONDS) || 3900 //1 hour and 5minutes;

// -- SETTINGS POLLS --
export const POLLS_DURATION_SECONDS = parseInt(process.env.POLLS_DURATION_QUESTION_SECONDS) || 3600; //1 hour