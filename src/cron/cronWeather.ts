import { CronJob } from "cron";
import { GroupService } from "../services/groupService";
import TelegramBot from "node-telegram-bot-api";
import { exceptionsHandler, wrapBotMessage } from "../utils/botUtils";
import { WeatherService } from "../services/weatherService";
import Logger from "../lib/logger";
import { DateTime } from "luxon";
import { IGroup } from "../domains/interfaces/IGroup";

const logger = Logger("cron-weather");

const groupService = new GroupService();
const weatherService = new WeatherService();

export default (bot: TelegramBot) => {
    new CronJob(
        '0 0 * * * *',
        async () => {
            logger.info("Check groups...");
            let groups: IGroup[] = [];

            try{
                groups = await groupService.listActiveWithTimeNow();
            }catch(err){
                logger.error("Failed get list groups, details:", err);
            }

            logger.debug("Find groups for send message, total count:"+groups.length);

            for (const group of groups) {
                

                await exceptionsHandler(
                    bot,
                    group.id,
                    async () => {
                        //get data weather from api
                        const weather = await weatherService.get(group.latitude, group.longitude);

                        //create message
                        let message = `Hello bikers! Let's see what the weather has to offer today!\n\n`;

                        for(let i = 0; i < weather.hourly.time.length; i++){
                            message += `${DateTime.fromISO(weather.hourly.time[i]).toFormat("HH:mm")} - ${weather.hourly.temperature_2m[i]}°C ${weather.hourly.rain[i] > 0? '🌧️' : weather.hourly.precipitation_probability[i] > 0? `🌧️? ${weather.hourly.precipitation_probability[i]}%` : '☀️'}\n`
                        }
        
                        bot.sendMessage(group.id, message);
                    }
                )
            }
            
            logger.info("Finish check groups");
        },
        null,
        true,
        DateTime.local().zoneName
    )
    
    logger.info("Started!");
}