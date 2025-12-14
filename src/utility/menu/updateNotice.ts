import _ from "lodash";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";
import {text, intro, outro} from "@clack/prompts";

import messageUtils from "../utils/messageUtils";

const FORMAT_DATE = "dd/MM/yyyy HH:mm:ss";

export default async (bot: TelegramBot) => {
    intro("Update Notice");

    const defaultValueDate = DateTime.now().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).plus({ day: 1 }).toFormat(FORMAT_DATE);

    const dateString = await text({
        message: "Enter the date and time when the bot will be updated",
        withGuide: true,
        initialValue: defaultValueDate,
        validate: (value) => {
            const checkDate = DateTime.fromFormat(value || "", FORMAT_DATE);

            if (!checkDate.isValid){
                return "Date is not valid, check format " + FORMAT_DATE;
            }

            if (checkDate.toJSDate() < new Date()){
                return "Date must be present or future";
            }
        }
    });

    if (!_.isString(dateString)){
        process.exit(1);
    }

    const date = DateTime.fromFormat(dateString, FORMAT_DATE);

    await messageUtils.sendNotice(bot, (group) => `Hello bikers 🏍️,\nthe bot is scheduled to be updated on ${date.setZone(group.timezone).toLocaleString()} 📆\nDuring that time, the bot will be temporarily unavailable.`);
    
    outro();
};