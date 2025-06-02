import NodeCache from "node-cache";
import Logger from "../lib/logger";
import TelegramBot from "node-telegram-bot-api";
import _ from "lodash";

const logger = Logger("user-cache");
const userCache = new NodeCache();

userCache.on('set', (key) => {
    logger.info(`Set user id "${key}" to cache`);
});
userCache.on('del', (key) => {
    logger.info(`Delete user id "${key}" from cache`);
});
userCache.on('expired', (key) => {
    logger.info(`Expired user id "${key}" from cache so it will delete`);
});

function getPrimaryKeyCompose(chatId: number, id: number){
    return `${chatId}-${id}`
}

function getMultiplePrimaryKeyCompose(chatId: number, ids: number[]){
    return _.cloneDeep(ids).map((id) => getPrimaryKeyCompose(chatId, id));
}

export default {
    getPrimaryKeyCompose,
    getMultiplePrimaryKeyCompose,

    userCache
}