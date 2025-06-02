import _ from "lodash";
import TelegramBot from "node-telegram-bot-api";

import { checkMyCommand, commands } from "./botUtils";

const historyCommand = new Map<string, commands>();

async function command(message: TelegramBot.Message, command: commands, functionExecuteCommand: (message: string) => Promise<void>, functionReadCommand: () => Promise<void>){
    if (!_.isNil(message.from) && !message.from.is_bot){
        const findCommandFromUser = historyCommand.get(getPrimarykeyCompose(message));
        if (!_.isNil(findCommandFromUser) && findCommandFromUser === command){

            if (!_.isNil(message.text)){
                await functionExecuteCommand(message.text);
                historyCommand.delete(getPrimarykeyCompose(message));
            }
        } else if (checkMyCommand(message.text, command)){
            historyCommand.set(getPrimarykeyCompose(message), command);

            await functionReadCommand();
        }
    }
}

function getPrimarykeyCompose(message: TelegramBot.Message){
    return `${message.chat.id}-${message.from.id}`;
}

export default {
    command
};