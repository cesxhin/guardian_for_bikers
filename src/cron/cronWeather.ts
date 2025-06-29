import _ from "lodash";
import { CronJob } from "cron";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger";
import { CRON_WEATHER, POLLS_EXPIRE_ACTION_SECONDS, POLLS_EXPIRE_QUESTION_SECONDS } from "../env";
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

                            let onlyTime: string;
                            for (let i = 0; i < weather.hourly.time.length; i++){

                                onlyTime = DateTime.fromISO(weather.hourly.time[i]).toFormat("HH:mm");

                                if(onlyTime >= group.start_time_guardian && onlyTime <= group.end_time_guardian){
                                    message += `${onlyTime} - ${weather.hourly.temperature_2m[i].toPrecision(3)}°C ${weather.hourly.rain[i] > 0? "🌧️" : weather.hourly.precipitation_probability[i] > 0? `💧 ${weather.hourly.precipitation_probability[i]}%` : "☀️"}\n`;
                                }else{
                                    _.remove(weather.hourly.time, (_, index) => index === i);
                                    _.remove(weather.hourly.precipitation_probability, (_, index) => index === i);
                                    _.remove(weather.hourly.rain, (_, index) => index === i);
                                    _.remove(weather.hourly.temperature_2m, (_, index) => index === i);
                                }
                            }
            
                            await bot.sendMessage(group.id, message);

                            //send question if zero rain or percentage rain
                            const findRain = _.find(weather.hourly.rain, (val) => val > 0);
                            const findPercentageRain = _.find(weather.hourly.precipitation_probability, (val) => val > 25);

                            if (_.isNil(findRain)){
                                let messagePoll: TelegramBot.Message;
                                let typePoll: "question" | "out";
                                
                                if (!_.isNil(findPercentageRain)){
                                    messagePoll = await bot.sendPoll(group.id, "There is a chance it might rain, do you still want to go out at your own risk?", ["Yes!", "No"], { is_anonymous: false });
                                    typePoll = "question";
                                } else {
                                    messagePoll = await bot.sendPoll(group.id, "Great news!\nThe weather is nice today, who's out?", ["I went out", "No"], { is_anonymous: false });
                                    typePoll = "out";
                                }

                                await pollService.create({
                                    id: messagePoll.poll.id,
                                    message_id: messagePoll.message_id,
                                    group_id: group.id,
                                    type: typePoll,
                                    expire: DateTime.now().plus({seconds: typePoll === "question"? POLLS_EXPIRE_QUESTION_SECONDS : POLLS_EXPIRE_ACTION_SECONDS}).toJSDate()
                                });
                            } else {
                                await bot.sendMessage(group.id, "Sorry bikers, but the weather doesn't look good, stay home!🏠");
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