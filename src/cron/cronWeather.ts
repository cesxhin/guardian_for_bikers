import { CronJob } from "cron";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger";
import { exceptionsHandler } from "../utils/botUtils";
import { IGroup } from "../domains/interfaces/IGroup";
import { GroupService } from "../services/groupService";
import { WeatherService } from "../services/weatherService";

const logger = Logger("cron-weather");

const groupService = new GroupService();
const weatherService = new WeatherService();

export default (bot: TelegramBot) => {
    new CronJob(
        "0 0 * * * *",
        async () => {
            logger.info("Check groups...");
            let groups: IGroup[] = [];

            try {
                groups = await groupService.listActive();
            } catch (err){
                logger.error("Failed get list groups, details:", err);
            }

            logger.debug("Find groups active, total count:"+groups.length);

            for (const group of groups) {
                if (DateTime.now().setZone(group.timezone).toFormat("HH:mm") === group.time_trigger && group.days_trigger[DateTime.now().weekday - 1] === true){
                    await exceptionsHandler(
                        bot,
                        group.id,
                        async () => {
                            //get data weather from api
                            const weather = await weatherService.get(group.latitude, group.longitude);

                            //create message
                            let message = "Hello bikers! Let's see what the weather has to offer today!\n\n";

                            for (let i = 0; i < weather.hourly.time.length; i++){
                                message += `${DateTime.fromISO(weather.hourly.time[i]).toFormat("HH:mm")} - ${weather.hourly.temperature_2m[i]}°C ${weather.hourly.rain[i] > 0? "🌧️" : weather.hourly.precipitation_probability[i] > 0? `🌧️? ${weather.hourly.precipitation_probability[i]}%` : "☀️"}\n`;
                            }

                            message += `\n\nYour settings:\nCurrent Location: ${group.location}\nCurrent timezone: ${group.timezone}\nCurrent time: ${group.time_trigger}`;
            
                            bot.sendMessage(group.id, message);
                        }
                    );
                }
            }
            
            logger.info("Finish check groups");
        },
        null,
        true,
        DateTime.local().zoneName
    );
    
    logger.info("Started!");
};