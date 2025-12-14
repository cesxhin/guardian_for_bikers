import _ from "lodash";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger";
import { USERNAME_BOT } from "../env";
import userCacheUtils from "./userCacheUtils";
import { GroupErrorGeneric, GroupNotFound, PollErrorGeneric, PollNotFound, UserErrorGeneric, UserNotFound } from "./exceptionsUtils";

const logger = Logger("bot-utils");

export const RESPONSIBILITY_POLICY = "\n⚠️⚠️ PLEASE NOTE ⚠️⚠️: That the data may be inaccurate, and we assume no responsibility for any damage";

export enum commands {
    SET_LOCATION = "set_location",
    SET_DAYS = "set_days",
    SET_ENABLE = "set_enable",
    SHOW_SETTINGS = "show_settings",
    SET_START_TIME_GUARDIAN = "set_start_time_guardian",
    SET_END_TIME_GUARDIAN = "set_end_time_guardian",
    IMPOSTOR = "impostor",
    ABOUT = "about"
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
            if (!_.isNil(message.from) && !message.from.is_bot){
                await userCacheUtils.getUserCache(message.chat.id, message.from.id, message.from.username as string); //todo controllare username
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
            await bot.sendMessage(chatId, "Sorry, Something Went Wrong.\nRemove me from the group and add me back!", { reply_markup: { remove_keyboard: true } });
        } else if (err instanceof GroupErrorGeneric || err instanceof UserErrorGeneric || err instanceof PollErrorGeneric){
            await bot.sendMessage(chatId, "Sorry, Something Went Wrong. Try again!", { reply_markup: { remove_keyboard: true } });
        } else if (err instanceof UserNotFound){
            await bot.sendMessage(chatId, "Sorry, Something Went Wrong.\nRemove me from the user and add me back!", { reply_markup: { remove_keyboard: true } });
        } else if (err instanceof PollNotFound){
            await bot.sendMessage(chatId, "Sorry, Something Went Wrong.\nThe poll should be republished in 30 minutes.", { reply_markup: { remove_keyboard: true } });
        } else {
            logger.error("Error generic, details:", err);
        }
    }
}

export function timeCommand(time: string): { text: string }[][]{
    return [
        [
            {text: `00:00 ${time == "00:00"? "✅" : "" }`},
            {text: `01:00 ${time == "01:00"? "✅" : "" }`},
            {text: `02:00 ${time == "02:00"? "✅" : "" }`},
            {text: `03:00 ${time == "03:00"? "✅" : "" }`}
        ],
        [
            {text: `04:00 ${time == "04:00"? "✅" : "" }`},
            {text: `05:00 ${time == "05:00"? "✅" : "" }`},
            {text: `06:00 ${time == "06:00"? "✅" : "" }`},
            {text: `07:00 ${time == "07:00"? "✅" : "" }`}
        ],
        [
            {text: `08:00 ${time == "09:00"? "✅" : "" }`},
            {text: `09:00 ${time == "09:00"? "✅" : "" }`},
            {text: `10:00 ${time == "10:00"? "✅" : "" }`},
            {text: `11:00 ${time == "11:00"? "✅" : "" }`}
        ],
        [
            {text: `12:00 ${time == "12:00"? "✅" : "" }`},
            {text: `13:00 ${time == "13:00"? "✅" : "" }`},
            {text: `14:00 ${time == "14:00"? "✅" : "" }`},
            {text: `15:00 ${time == "15:00"? "✅" : "" }`}
        ],
        [
            {text: `16:00 ${time == "16:00"? "✅" : "" }`},
            {text: `17:00 ${time == "17:00"? "✅" : "" }`},
            {text: `18:00 ${time == "18:00"? "✅" : "" }`},
            {text: `19:00 ${time == "19:00"? "✅" : "" }`}
        ],
        [
            {text: `20:00 ${time == "20:00"? "✅" : "" }`},
            {text: `21:00 ${time == "21:00"? "✅" : "" }`},
            {text: `22:00 ${time == "22:00"? "✅" : "" }`},
            {text: `23:00 ${time == "23:00"? "✅" : "" }`}
        ],
        [{text: "Cancel"}]
    ];
}

export function createMention(message: { first_name: string, user_id: number }, text: string){
    return `[${message.first_name}](tg://user?id=${message.user_id}) ${text.replace(/([_*\[\]()~`>#+=|{}.!-])/g, "\\$1")}`;
}

export const MESSAGE_WELCOME =
`
Hello bikers! 🏍️💨

From now on, I will be here to protect you from bad weather.

What can this bot do?
- It is possible to configure this bot to adapt your outings.
- There is a mini-game where each player who goes out will earn points, and at the end of the year the winner will be announced.

And more new features will come in the future!💡

Explanation for the mini-game🎮:
When the weather monitoring starts, the mini-game will also automatically begin, where each player who goes out can earn points and at the end of the year an official ranking will be released announcing the top three winners.

There will be three cases:
1. If the weather forecast shows sun all day, a poll will appear that will give you one point if you went out.
2. If the weather forecast shows more than 25% chance of rain, a poll will appear asking if you still want to go out despite the risk. To pass this question, at least 1 people must vote. If passed, another poll will appear that will give you double points if you didn't get wet, and if you did get wet, you will lose the double points!
3. If the weather forecast shows 100% rain, no poll will appear.

⚠️⚠️ PLEASE NOTE ⚠️⚠️:
- Weather conditions cannot be predicted with 100% accuracy, and the APIs used to obtain weather data may be inaccurate. Therefore, incorrect data may be provided, and we assume no responsibility for any damage.
- The collection of location data will be deleted at the end of the poll, and only the kilometers traveled will be taken into account.
- If you remove the bot from the group, all data will be deleted!

Enough with the explanations now, have fun bikers!🏍️💨
`;