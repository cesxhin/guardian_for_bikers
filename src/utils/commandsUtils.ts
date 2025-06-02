import _ from "lodash";
import TelegramBot from "node-telegram-bot-api";

import userCacheUtils from "./userCacheUtils";
import { checkMyCommand, commands } from "./botUtils";

const historyCommand = new Map<string, commands>();

async function command(message: TelegramBot.Message, command: commands, functionExecuteCommand: (message: string) => Promise<void>, functionReadCommand: () => Promise<void>){
    if (!_.isNil(message.from) && !message.from.is_bot){
        const findCommandFromUser = historyCommand.get(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id));
        if (!_.isNil(findCommandFromUser) && findCommandFromUser === command){

            if (!_.isNil(message.text)){
                await functionExecuteCommand(message.text);
                historyCommand.delete(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id));
            }
        } else if (checkMyCommand(message.text, command)){
            historyCommand.set(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id), command);

            await functionReadCommand();
        }
    }
}

export default {
    command
};