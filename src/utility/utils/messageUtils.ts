import _ from "lodash";
import { log, progress } from "@clack/prompts";
import TelegramBot from "node-telegram-bot-api";

import { IGroup } from "../../domains/interfaces/IGroup";
import { modelGroup } from "../../domains/models/groupModel";

async function sendNotice(bot: TelegramBot, message: ((group: IGroup) => string) | string){
    let list: IGroup[];
    try{
        list = await modelGroup.find().lean<IGroup[]>();
    }catch(err){
        log.error("Failed get list groups, details: " + err);
        process.exit(1);
    }

    log.info(`Found ${list.length} groups`);
    
    const p = progress({max: 100, indicator: "timer", style: "block"});

    p.start("Notification status");

    const failedSend: string[] = [];
    for (const group of list) {
        try{
            await bot.sendMessage(group.id, _.isFunction(message)? message(group) : message);
        }catch(err){
            failedSend.push("Report: failed send message this group id " + group.id + ", details: " + err);
        }

        p.advance(Math.ceil(100 / list.length));
    }

    p.stop("Notified");

    for (const message of failedSend) {
        log.error(message);
    }
}

export default {
    sendNotice
}