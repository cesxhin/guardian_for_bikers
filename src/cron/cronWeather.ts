import _ from "lodash";
import { CronJob } from "cron";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger";
import { CRON_WEATHER } from "../env";
import { exceptionsHandler } from "../utils/botUtils";
import { IGroup } from "../domains/interfaces/IGroup";
import { PollService } from "../services/pollService";
import { GroupService } from "../services/groupService";
import { WeatherService } from "../services/weatherService";

const logger = Logger("cron-weather");

const groupService = new GroupService();
const weatherService = new WeatherService();
const pollService = new PollService();

export default (bot: TelegramBot) => {
    new CronJob(
        CRON_WEATHER,
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
            
                            await bot.sendMessage(group.id, message);

                            //send question if zero rain or percentage rain
                            const findRain = _.find(weather.hourly.rain, (val) => val > 0);
                            const findPercentageRain = _.find(weather.hourly.precipitation_probability, (val) => val > 25);

                            if (_.isNil(findRain)){
                                let messagePoll: TelegramBot.Message;
                                let typePoll: "question" | "out";
                                
                                if (!_.isNil(findPercentageRain)){
                                    messagePoll = await bot.sendPoll(group.id, "is there any chance of rain, are you sure you want to go out anyway?", ["Yes!", "No"], { is_anonymous: false });
                                    typePoll = "question";
                                } else {
                                    messagePoll = await bot.sendPoll(group.id, "Great news!\nThe weather is nice today, who's going out?", ["I'm here", "No"], { is_anonymous: false });
                                    typePoll = "out";
                                }

                                await pollService.create({
                                    id: messagePoll.poll.id,
                                    message_id: messagePoll.message_id,
                                    group_id: group.id,
                                    type: typePoll
                                });
                            }
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