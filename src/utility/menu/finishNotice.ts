import TelegramBot from "node-telegram-bot-api";
import {log, confirm, intro, outro} from "@clack/prompts";

import messageUtils from "../utils/messageUtils";

export default async (bot: TelegramBot) => {
    intro("Finish Notice");

    const acceptSendNotice = (await confirm({message: "Do you really want to notify everyone that you've finished the bot maintenance?"})) === true;

    if (acceptSendNotice){
        await messageUtils.sendNotice(bot, "Thank you for your patience! The maintenance is over and the bot is back online 🏍️");
    } else {
        log.info("Cancel the action");
    }
    
    outro();
};