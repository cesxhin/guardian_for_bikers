import _ from "lodash";
import NodeCache from "node-cache";

import Logger from "../lib/logger";
import { USERS_EXPIRE_SECONDS } from "../env";
import { IUser } from "../domains/interfaces/IUser";
import { UserService } from "../services/userService";
import AsyncLock from "async-lock";
import { UserNotFound } from "./exceptionsUtils";

const logger = Logger("user-cache");
const lockUserCache = new AsyncLock();
const userService = new UserService();
const userCache = new NodeCache({
    stdTTL: USERS_EXPIRE_SECONDS,
    checkperiod: 300 //5 minutes
});

userCache.on("set", (key) => {
    logger.info(`Set user id "${key}" to cache`);
});
userCache.on("del", (key) => {
    logger.info(`Delete user id "${key}" from cache`);
});
userCache.on("expired", (key) => {
    logger.info(`Expired user id "${key}" from cache so it will delete`);
});

function getPrimaryKeyCompose(chatId: number, id: number){
    return `${chatId}-${id}`;
}

function getKeysFromChatId(chatId: number){
    return userCache.keys().filter((key) => key.startsWith(`${chatId}-`));
}

function getMultiplePrimaryKeyCompose(chatId: number, ids: number[]){
    return _.cloneDeep(ids).map((id) => getPrimaryKeyCompose(chatId, id));
}

async function getUserCache(chatId: number, id: number, username: string): Promise<IUser> {
    return await lockUserCache.acquire(getPrimaryKeyCompose(chatId, id), async () => {
        if (!userCache.has(getPrimaryKeyCompose(chatId, id))){
            logger.debug(`Not found this user id "${id}" from cache`);

            let user: IUser | null = null;
            try {
                user = await userService.findById(chatId, id);
            } catch (err){
                if (!(err instanceof UserNotFound)){
                    throw err;
                }
            }

            if (_.isNil(user)){
                logger.debug(`Creating user id "${id}"...`);
                user = await userService.create(chatId, id, username);
                logger.info(`Created user id "${id}"`);
            }

            userCache.set(getPrimaryKeyCompose(chatId, id), user);
        }

        return userCache.get(getPrimaryKeyCompose(chatId, id)) as IUser;
    });
}

export default {
    getPrimaryKeyCompose,
    getMultiplePrimaryKeyCompose,
    getKeysFromChatId,
    getUserCache,

    userCache
};