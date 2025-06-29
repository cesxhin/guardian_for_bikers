import _ from "lodash";
import AsyncLock from "async-lock";
import TelegramBot from "node-telegram-bot-api";

import Logger from "./lib/logger";
import { USERNAME_BOT } from "./env";
import commandsUtils from "./utils/commandsUtils";
import { IPoll } from "./domains/interfaces/IPoll";
import userCacheUtils from "./utils/userCacheUtils";
import pollCacheUtils from "./utils/pollCacheUtils";
import { UserService } from "./services/userService";
import { PollService } from "./services/pollService";
import { GroupService } from "./services/groupService";
import { UserNotFound } from "./utils/exceptionsUtils";
import { LocationSerivce } from "./services/locationService";
import {commands, exceptionsHandler, timeCommand, wrapBotMessage } from "./utils/botUtils";
import { DateTime } from "luxon";

const logger = Logger("bot");

const groupSerivce = new GroupService();
const locationService = new LocationSerivce();
const userService = new UserService();
const pollService = new PollService();

const lockPollCache = new AsyncLock();

export default async function (bot: TelegramBot){
    //const
    const arrayDays = [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday"
    ];

    //set commands
    logger.debug("settings commands")
    bot.setMyCommands([
        { command: commands.SET_LOCATION, description: "Set a location where you want to receive weather updates." },
        { command: commands.SET_DAYS, description: "Manage the days of the week to receive weather updates." },
        { command: commands.SET_ENABLE, description: "Manage whether to suspend the bot." },
        { command: commands.SET_TIME, description: "Set the time to receive weather updates." },
        { command: commands.SET_START_TIME_GUARDIAN, description: "Check the weather only from the time you set onward." },
        { command: commands.SET_END_TIME_GUARDIAN, description: "Check the weather up to the time that was set." },
        { command: commands.SHOW_SETTINGS, description: "Show current settings." },
    ], {
        scope: {
            type: "all_chat_administrators"
        }
    });

    //debug
    wrapBotMessage(bot, async (message) => {
        logger.debug(JSON.stringify(message));
    });

    //permission only group
    wrapBotMessage(bot, () => null, async (message) => {
        if (message.text.startsWith("/start")){
            await bot.sendMessage(message.chat.id, "This bot can only be used in groups!");
        }
    });

    //command location
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_LOCATION,
            async (location) => {
                const findLocation = await locationService.exist(location);
                if (!_.isNil(findLocation)){
                    await groupSerivce.edit(message.chat.id, {
                        latitude: findLocation.latitude,
                        longitude: findLocation.longitude,
                        location
                    });
                    await bot.sendMessage(message.chat.id, `Successfully updated the position "${location}" 📍`);
                } else {
                    await bot.sendMessage(message.chat.id, `I couldn't find the position "${location}"`);
                }
            },
            async () => {
                await bot.sendMessage(message.chat.id, "Enter the name of the city whose weather you want to monitor.\nExample: roma or Roma");
            }
        );
    });
    
    //command set days
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_DAYS,
            async (day) => {
                day = day.replace(" ✅", "").replace(" ❌", "").toLowerCase();

                if (arrayDays.includes(day)){
                    //get data group
                    let group = await groupSerivce.find(message.chat.id);

                    //get index day for change state
                    const currentIndex = arrayDays.findIndex((value) => value === day);

                    //clone data and change state
                    const currentDaysTrigger = _.cloneDeep(group.days_trigger);
                    currentDaysTrigger[currentIndex] = !currentDaysTrigger[currentIndex];
                    
                    //save data edited
                    group = await groupSerivce.edit(message.chat.id, {
                        days_trigger: currentDaysTrigger
                    });
                    
                    await bot.sendMessage(message.chat.id, `The ${day} is  ${group.days_trigger[currentIndex]? "enabled" : "disabled" } for weather monitoring.`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else if (day === "Cancel"){
                    await bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    await bot.sendMessage(message.chat.id, `The word ${day} is not recognized as one of the days of the week. Please use the commands or write one of these: ${arrayDays.join(", ")}.`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                }
                
            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id, "You can decide which days you want to receive weather updates.", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: [
                            [
                                {text: `Monday ${group.days_trigger[0]? "✅" : "❌" }`},
                                {text: `Tuesday ${group.days_trigger[1]? "✅" : "❌" }`},
                                {text: `Wednesday ${group.days_trigger[2]? "✅" : "❌" }`}
                            ],
                            [
                                {text: `Thursday ${group.days_trigger[3]? "✅" : "❌" }`},
                                {text: `Friday ${group.days_trigger[4]? "✅" : "❌" }`},
                                {text: `Saturday ${group.days_trigger[5]? "✅" : "❌" }`}
                            ],
                            [
                                {text: `Sunday ${group.days_trigger[6]? "✅" : "❌" }`},
                                {text: "Cancel"}
                            ]
                        ]
                    }
                });
            }
        );
    });
    
    //command set time
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_TIME,
            async (time) => {
                time = time.replace(" ✅", "");

                const checkFormatTime = /^(0[0-9]|1[0-9]|2[0-3]):00$/;

                if (checkFormatTime.test(time)){
                    await groupSerivce.edit(message.chat.id, {
                        time_trigger: time
                    });

                    await bot.sendMessage(message.chat.id, `Okay set to this time: "${time}"`, { reply_markup: { remove_keyboard: true } });
                } else if (time === "Cancel"){
                    await bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    await bot.sendMessage(message.chat.id, `Invalid format time "${time}", I only accept hours from 00 to 23.\nExample: HH:00`, { reply_markup: { remove_keyboard: true } });
                }
            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id, "You can choose what time you want to receive the updates", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: timeCommand(group.time_trigger)
                    }
                });
            }
        );
    });

    //command active/disactive bot for group
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_ENABLE,
            async (enable) => {
                enable = enable.toLocaleLowerCase();

                if (enable === "✅" || enable === "❌"){
                    await groupSerivce.edit(message.chat.id, { enabled: enable === "✅" });

                    await bot.sendMessage(message.chat.id, `The bot has been ${enable === "✅"? "actived" : "suspended" }.`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else if (enable === "Cancel"){
                    await bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    await bot.sendMessage(message.chat.id, `The word "${enable}" is not recognized to suspend or reactivate the bot. Please use the commands or write one of these: actived, suspended`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                }

            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id, "You can decide whether to temporarily suspend the bot.", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: [
                            [{text: `${!group.enabled? "✅" : "❌" }`}],
                            [{text: "Cancel"}]
                        ]
                    }
                });
            }
        );
    });

    //leave someone
    wrapBotMessage(bot, async (message) => {
        if (!_.isNil(message.left_chat_member)){
            if (message.left_chat_member.is_bot){
                if (message.left_chat_member.username === USERNAME_BOT){
                    await groupSerivce.delete(message.chat.id);
                    const listIds = await userService.getIdsByChatId(message.chat.id);
                    await userService.deleteManyByChatId(message.chat.id);
                    await pollService.deleteByChatId(message.chat.id);

                    userCacheUtils.userCache.del(userCacheUtils.getMultiplePrimaryKeyCompose(message.chat.id, listIds));

                    logger.info(`Someone kicked me out of the group id "${message.chat.id}"`);
                }
            } else {
                try {
                    await userService.deleteById(message.chat.id, message.left_chat_member.id);
                } catch (err){
                    if (!(err instanceof UserNotFound)){
                        throw err;
                    } else {
                        logger.error(`Not found user id "${message.left_chat_member.id}" for delete document user`);
                        return;
                    }
                }

                userCacheUtils.userCache.del(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.left_chat_member.id));
            }
        }
    });

    //entry someone
    wrapBotMessage(bot, async (message) => {
        if (!_.isNil(message.new_chat_members)){
            for (const new_chat_member of message.new_chat_members) {
                if (new_chat_member.is_bot){
                    if (new_chat_member.username === USERNAME_BOT){
                        const findMyBot = _.find(message.new_chat_members, {is_bot: true, username: USERNAME_BOT});

                        if (!_.isNil(findMyBot)){
                            await groupSerivce.create(message.chat.id, message.chat.title || "unknwon");
                            logger.info(`Someone added me to the group id "${message.chat.id}"`);
                            
                            await bot.sendMessage(message.chat.id,
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
2. If the weather forecast shows more than 25% chance of rain, a poll will appear asking if you still want to go out despite the risk. To pass this question, at least 2 people must vote. If passed, another poll will appear that will give you double points if you didn't get wet, and if you did get wet, you will lose the double points!
3. If the weather forecast shows 100% rain, no poll will appear.


Enough with the explanations now, have fun bikers!🏍️💨

⚠️⚠️ WARNING ⚠️⚠️: If you remove the bot from the group, all data will be deleted!
`
                            );
                        }
                    }
                } else {
                    const user = await userService.create(message.chat.id, new_chat_member.id, new_chat_member.username || new_chat_member.first_name);
                    userCacheUtils.userCache.set(userCacheUtils.getPrimaryKeyCompose(message.chat.id, new_chat_member.id), user);
                }
            }
        }
    }); 

    //change name of group
    bot.on("new_chat_title", async (message) => {
        await exceptionsHandler(bot, message.chat.id, async () => {
            if (!_.isNil(message.new_chat_title)){
                await groupSerivce.edit(message.chat.id, {
                    name: message.new_chat_title
                });

                logger.info(`Changed title from group id "${message.chat.id}" with new name "${message.new_chat_title}"`);
            }
        });
    });

    //answer
    bot.on("poll_answer", async (pollAnswer) => {
        await lockPollCache.acquire(pollAnswer.poll_id, async () => {

            let poll: IPoll;
            try {
                poll = await pollCacheUtils.getPollCache(pollAnswer.poll_id);
            } catch (err){
                logger.error("Failed get data poll from cache, details:", err);
                return;
            }

            if (poll.type === "question"){
                logger.debug(`This poll id "${pollAnswer.poll_id}" is a question so skip evalutate points for user id ${pollAnswer.user.id}`);
                return;
            }

            await exceptionsHandler(bot, poll.group_id, async () => {
                const user = await userCacheUtils.getUserCache(poll.group_id, pollAnswer.user.id, pollAnswer.user.username);
                
                let points = 0;
                let skipOut = false;
                
                switch (poll.type){
                case "out":
                    if (pollAnswer.option_ids[0] === 0){
                        points++;
                    } else {
                        skipOut = true;
                    }
                    break;
                case "out_x2":
                    if (pollAnswer.option_ids[0] === 0){
                        points = 2;
                    } else if (pollAnswer.option_ids[0] === 1){
                        points = -2;
                    } else {
                        skipOut = true;
                    }
                    break;
                default:
                    logger.error(`Unknwon type poll "${poll.type}"`);
                    return;
                }

                await userService.edit(user.chat_id, user.id, {
                    points: user.points + points,
                    outWithBike: user.outWithBike + (skipOut? 0 : 1),
                    skipOutWithBike: user.skipOutWithBike + (skipOut? 1 : 0)
                });

                await pollService.answered(pollAnswer.poll_id, user.id);
            });
        });
    });

    //command show settings
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SHOW_SETTINGS,
            null,
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id,
`
Your current settings:
🤖 Bot is ${group.enabled? 'activated' : "suspended"}
📍 Location: ${group.location}
🕑 Time zone: ${group.timezone}
⏰ Weather time check: ${group.time_trigger}
📅 Weather days check: ${arrayDays.filter((_, index) => group.days_trigger[index]).join(", ")}
💂 Time guardian: ${group.start_time_guardian} - ${group.end_time_guardian}
📝 Last update: ${DateTime.fromJSDate(group.updated).setZone(group.timezone).toLocaleString(DateTime.DATETIME_SHORT)}
`
);
            }
        );
    });

    //command set start time guardian
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_START_TIME_GUARDIAN,
            async (time) => {
                time = time.replace(" ✅", "");

                const group = await groupSerivce.find(message.chat.id);

                const checkFormatTime = /^(0[0-9]|1[0-9]|2[0-3]):00$/;

                if (checkFormatTime.test(time)){
                    if(time > group.end_time_guardian){
                        await bot.sendMessage(message.chat.id, `The start time cannot be later than ${group.end_time_guardian}`, { reply_markup: { remove_keyboard: true } });
                    }else{
                        await groupSerivce.edit(message.chat.id, {
                            start_time_guardian: time
                        });

                        await bot.sendMessage(message.chat.id, `Okay set to this time: "${time}"`, { reply_markup: { remove_keyboard: true } });
                    }
                } else if (time === "Cancel"){
                    await bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    await bot.sendMessage(message.chat.id, `Invalid format time "${time}", I only accept hours from 00 to 23.\nExample: HH:00`, { reply_markup: { remove_keyboard: true } });
                }
            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id, "Set the start time for weather checks", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: timeCommand(group.start_time_guardian)
                    }
                });
            }
        );
    });

    //command set end time guardian
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_END_TIME_GUARDIAN,
            async (time) => {
                time = time.replace(" ✅", "");

                const group = await groupSerivce.find(message.chat.id);

                const checkFormatTime = /^(0[0-9]|1[0-9]|2[0-3]):00$/;

                if (checkFormatTime.test(time)){
                    if(time < group.start_time_guardian){
                        await bot.sendMessage(message.chat.id, `The end time cannot be earlier than ${group.start_time_guardian}`, { reply_markup: { remove_keyboard: true } });
                    }else{
                        await groupSerivce.edit(message.chat.id, {
                            end_time_guardian: time
                        });

                        await bot.sendMessage(message.chat.id, `Okay set to this time: "${time}"`, { reply_markup: { remove_keyboard: true } });
                    }
                } else if (time === "Cancel"){
                    await bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    await bot.sendMessage(message.chat.id, `Invalid format time "${time}", I only accept hours from 00 to 23.\nExample: HH:00`, { reply_markup: { remove_keyboard: true } });
                }
            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id, "Set the end time for weather checks", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: timeCommand(group.end_time_guardian)
                    }
                });
            }
        );
    });
    
    logger.info("Started!");
}