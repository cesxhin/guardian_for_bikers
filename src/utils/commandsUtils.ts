import _ from "lodash";
import { DeleteMessageResult, Message, SendMessageParams, SendMessageResult } from "node-telegram-bot-api";

import { bot } from "../index.ts";
import Logger from "../lib/logger.ts";
import userCacheUtils from "./userCacheUtils.ts";
import { checkMyCommand, commands } from "./botUtils.ts";

const logger = Logger("command-utils");

const historyCommand = new Map<string, {command: commands, messages_id: number[]}>();

async function deleteMessage(action: Promise<DeleteMessageResult>){
    try {
        await action;
    } catch(err: any){
        const message = ["Error delete old messages, details:", err];
        if (err.message.includes("message to delete not found")){
            logger.warn(message);
        } else {
            logger.error(message);
        }
    }
}

async function command({
    message,
    command,
    functionExecuteCommand = null,
    functionReadCommand
}: {
    message: Message,
    command: commands,
    functionExecuteCommand?: ((text: string, message: Message) => Promise<SendMessageResult | undefined>) | null,
    functionReadCommand: () => Promise<SendMessageResult>
}){
    if (!_.isNil(message.from) && !message.from.is_bot){

        let findCommandFromUser: {command: commands, messages_id: number[]} | undefined | null = null;
        if (!_.isNil(functionExecuteCommand)){
            findCommandFromUser = historyCommand.get(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id));
        }
        
        if (!_.isNil(functionExecuteCommand) && !_.isNil(findCommandFromUser) && findCommandFromUser.command === command){

            if (!_.isNil(message.text)){
                const messageResult = await functionExecuteCommand(message.text, message);

                //delete old messages
                if (!_.isNil(messageResult)){
                    setTimeout(async () => {
                        await deleteMessage(bot.deleteMessage(message.chat.id, messageResult.message_id));
                    }, 10000);
                }

                findCommandFromUser.messages_id.push(message.message_id);
                
                await deleteMessage(bot.deleteMessages(message.chat.id, findCommandFromUser.messages_id));

                //delete track history command
                historyCommand.delete(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id));
            }
        } else if (checkMyCommand(message.text, command)){

            const messageResult = await functionReadCommand();

            if (!_.isNil(functionExecuteCommand)){
                historyCommand.set(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.from.id), {
                    command,
                    messages_id: [messageResult.message_id, message.message_id]
                });
            }
        }
    }
}

async function replyMessageSend(chatId: number, message: string, options: Omit<SendMessageParams, "chat_id" | "text"> = {}): Promise<SendMessageResult>{
    return await bot.sendMessage(chatId, message, {
        disable_notification: true,
        reply_markup: {
            remove_keyboard: true
        },
        ...options
    });
}

export default {
    command,
    replyMessageSend
};