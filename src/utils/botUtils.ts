import TelegramBot from "node-telegram-bot-api";

export function onlyPermissionGroup(message: TelegramBot.Message){
    return message.chat.type === 'group' || message.chat.type === 'supergroup';
}