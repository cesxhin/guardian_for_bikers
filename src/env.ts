import {config} from "dotenv";
config();

//-- BOT --
export const TOKEN_BOT = process.env.TOKEN_BOT || null;
export const USERNAME_BOT = process.env.USERNAME_BOT || null;

//-- MONGO --
export const URL_MONGO = process.env.URL_MONGO || "mongodb://127.0.0.1:27017/guards_for_bikers";

// -- GENERIC --
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";