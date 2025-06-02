import _ from "lodash";
import AsyncLock from "async-lock";
import TelegramBot from "node-telegram-bot-api";

import { USERNAME_BOT } from "../env";
import { GroupErrorGeneric, GroupNotFound, UserErrorGeneric, UserNotFound } from "./exceptionsUtils";
import Logger from "../lib/logger";
import userCacheUtils from "./userCacheUtils";
import { UserService } from "../services/userService";
import { IUser } from "../domains/interfaces/IUser";

const userService = new UserService();

const lockUserCache = new AsyncLock();

const logger = Logger("bot-utils");

export enum commands {
    SET_LOCATION = "set_location",
    SET_DAYS = "set_days",
    SET_ENABLE = "set_enable",
    SET_TIME = "set_time"
}

export function onlyPermissionGroup(message: TelegramBot.Message){
    return message.chat.type === "group" || message.chat.type === "supergroup";
}

export function checkMyCommand(text: string | undefined | null, command: commands): boolean {
    if (!_.isNil(text)){
        let buildCommand = `/${command}`;

        if (text.indexOf("@") !== -1){
            buildCommand += `@${USERNAME_BOT}`;
        }

        return text.indexOf(buildCommand) !== -1;
    }

    return false;
}

export function wrapBotMessage(bot: TelegramBot, main: (message: TelegramBot.Message) => Promise<void>, functionNotPermission?: (message: TelegramBot.Message) => Promise<void>): void{
    bot.on("message", async (message) => {
        await exceptionsHandler(bot, message.chat.id, async () => {
            //check cache user
            if(!_.isNil(message.from) && !message.from.is_bot){

                await lockUserCache.acquire(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id), async () => {
                    if(!userCacheUtils.userCache.has(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id))){
                        logger.debug(`Not found this user id "${message.from.id}" from cache`);

                        let user: IUser | null = null;
                        try{
                            user = await userService.findById(message.from.id);
                        }catch(err){
                            if(!(err instanceof UserNotFound)){
                                throw err;
                            }
                        }

                        if(_.isNil(user)){
                            logger.debug(`Creating user id "${message.from.id}"...`);
                            user = await userService.create(message.chat.id, message.from.id, message.from.username || message.from.first_name);
                            logger.info(`Created user id "${message.from.id}"`);
                        }

                        userCacheUtils.userCache.set(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id), user);
                    }
                })
            }

            if (onlyPermissionGroup(message)){
                await main(message);
            } else if (!_.isNil(functionNotPermission)){
                await functionNotPermission(message);
            }
        });
    });
}

export async function exceptionsHandler(bot: TelegramBot, chatId: number, genericFunction: () => Promise<any>){
    try {
        await genericFunction();
    } catch (err){
        if (err instanceof GroupNotFound){
            bot.sendMessage(chatId, "Sorry, Something Went Wrong.\nRemove me from the group and add me back!", { reply_markup: { remove_keyboard: true } });
        } else if (err instanceof GroupErrorGeneric || err instanceof UserErrorGeneric){
            bot.sendMessage(chatId, "Sorry, Something Went Wrong. Try again!", { reply_markup: { remove_keyboard: true } });
        } else if (err instanceof UserNotFound){
            bot.sendMessage(chatId, "Sorry, Something Went Wrong.\nRemove me from the user and add me back!", { reply_markup: { remove_keyboard: true } });
        } else {
            logger.error("Error generic, details:", err);
        }
    }
}