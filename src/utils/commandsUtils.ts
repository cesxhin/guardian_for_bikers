import _ from "lodash";
import { Message } from "node-telegram-bot-api";

import userCacheUtils from "./userCacheUtils.ts";
import { checkMyCommand, commands } from "./botUtils.ts";

const historyCommand = new Map<string, commands>();

async function command({
    message,
    command,
    functionExecuteCommand = null,
    functionReadCommand
}: {
    message: Message,
    command: commands,
    functionExecuteCommand?: ((text: string, message: Message) => Promise<void>) | null,
    functionReadCommand: () => Promise<void>
}){
    if (!_.isNil(message.from) && !message.from.is_bot){

        let findCommandFromUser: commands | undefined | null = null;
        if (!_.isNil(functionExecuteCommand)){
            findCommandFromUser = historyCommand.get(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id));
        }
        
        if (!_.isNil(functionExecuteCommand) && !_.isNil(findCommandFromUser) && findCommandFromUser === command){

            if (!_.isNil(message.text)){
                await functionExecuteCommand(message.text, message);
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