import _ from "lodash";
import { CronJob } from "cron";
import { DateTime, Duration } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger.ts";
import graphUtils from "../utils/graphUtils.ts";
import { IGroup } from "../domains/interfaces/IGroup.ts";
import { EventService } from "../applications/services/eventService.ts";
import { GroupService } from "../applications/services/groupService.ts";
import { WeatherService } from "../applications/services/weatherService.ts";
import { exceptionsHandler, RESPONSIBILITY_POLICY } from "../utils/botUtils.ts";
import { CRON_WEATHER, EVENT_EXPIRE_QUESTION_SECONDS, POLL_EXPIRE_ACTION_SECONDS } from "../env.ts";

const logger = Logger("cron-weather");

const groupService = new GroupService();
const weatherService = new WeatherService();
const eventService = new EventService();

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

            let timeTrigger: string;
            for (const group of groups) {
                timeTrigger = DateTime.fromISO(`${DateTime.now().toISODate()}T${group.start_time_guardian}`, {zone: group.timezone}).toFormat("HH:mm");

                if (DateTime.now().setZone(group.timezone).toFormat("HH:mm") === timeTrigger && group.days_trigger[DateTime.now().weekday - 1] === true){
                    await exceptionsHandler(
                        bot,
                        group.id,
                        async () => {
                            //get data weather from api
                            const weather = await weatherService.get(group.latitude, group.longitude);

                            //create message
                            let onlyTime: string;
                            const dataTypeWeather: string[] = [];
                            const listTimeBlacklist: number[] = [];

                            let time: string | undefined, prec: number | undefined, rain: number | undefined;
                            for (let i = 0; i < weather.hourly.time.length; i++){

                                time = weather.hourly.time[i];
                                rain = weather.hourly.rain[i];
                                prec = weather.hourly.precipitation_probability[i];

                                if (_.isNil(time) || _.isNil(rain) || _.isNil(prec)){
                                    continue;
                                }

                                onlyTime = DateTime.fromISO(time).toFormat("HH:mm");

                                if (onlyTime >= group.start_time_guardian && onlyTime <= group.end_time_guardian){
                                    if (rain > 0){
                                        dataTypeWeather.push("2");
                                    } else if (prec > 0){
                                        dataTypeWeather.push(`1 - ${weather.hourly.precipitation_probability[i]}`);
                                    } else {
                                        dataTypeWeather.push("0");
                                    }
                                } else {
                                    listTimeBlacklist.push(i);
                                }
                            }

                            //if user has set range custom for check weather
                            _.remove(weather.hourly.time, (_, index) => listTimeBlacklist.includes(index));
                            _.remove(weather.hourly.precipitation_probability, (_, index) => listTimeBlacklist.includes(index));
                            _.remove(weather.hourly.rain, (_, index) => listTimeBlacklist.includes(index));
                            _.remove(weather.hourly.temperature_2m, (_, index) => listTimeBlacklist.includes(index));

                            const result = await graphUtils.render(600 * 4, 250 * 4, weather.hourly.time.map((time) => DateTime.fromFormat(time, "yyyy-MM-dd'T'HH:mm").setLocale(group.timezone).toISO()).filter((date) => !_.isNil(date)), weather.hourly.temperature_2m, dataTypeWeather);
            
                            await bot.sendPhoto(group.id, result, {
                                caption: "Hello bikers! Let's see what the weather has to offer today!"
                            }, {
                                filename: `${group.name}-${DateTime.now().toISO()}.png`,
                                contentType: "image/png"
                            });

                            //send question if zero rain or percentage rain
                            const findRain = _.find(weather.hourly.rain, (val) => val > 0);
                            const findPercentageRain = _.find(weather.hourly.precipitation_probability, (val) => val > 25);

                            if (_.isNil(findRain)){
                                let messagePoll: TelegramBot.Message | null = null;

                                //set expire event for generate poll
                                const endTime = Duration.fromISOTime(group.end_time_guardian);
                                const expire = DateTime.now().set({hour: endTime.hours, minute: endTime.minutes, millisecond: 0, second: 0});

                                if (!_.isNil(findPercentageRain)){
                                    messagePoll = await bot.sendPoll(
                                        group.id,
                                        "There is a chance it might rain, do you still want to go out at your own risk?"+RESPONSIBILITY_POLICY,
                                        ["Yes!", "No"],
                                        {
                                            is_anonymous: false,
                                            open_period: EVENT_EXPIRE_QUESTION_SECONDS
                                        }
                                    );

                                    if (!_.isNil(messagePoll.poll?.id)){
                                        await eventService.create({
                                            type: "question",
                                            group_id: group.id,
                                            poll_id: messagePoll.poll.id,
                                            expire_poll: DateTime.now().plus({ seconds: POLL_EXPIRE_ACTION_SECONDS }).toJSDate()
                                        });
                                    } else {
                                        logger.error("Failed get poll id for event question");
                                    }
                                } else {
                                    await bot.sendMessage(group.id, "Great news!\nThe weather is nice today"+RESPONSIBILITY_POLICY);
                                    await eventService.create({
                                        type: "out",
                                        group_id: group.id,
                                        poll_id: null,
                                        expire_poll: null,
                                        expire: expire.toJSDate()
                                    });
                                }
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