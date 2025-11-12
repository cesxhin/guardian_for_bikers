import _ from "lodash";
import { DateTime } from "luxon";
import AsyncLock from "async-lock";
import TelegramBot from "node-telegram-bot-api";

import Logger from "./lib/logger";
import commandsUtils from "./utils/commandsUtils";
import { IPoll } from "./domains/interfaces/IPoll";
import { IUser } from "./domains/interfaces/IUser";
import userCacheUtils from "./utils/userCacheUtils";
import pollCacheUtils from "./utils/pollCacheUtils";
import { UserService } from "./services/userService";
import { PollService } from "./services/pollService";
import { GroupService } from "./services/groupService";
import { TrackService } from "./services/trackService";
import { LocationSerivce } from "./services/locationService";
import { POLLS_EXPIRE_IMPOSTOR_SECONDS, USERNAME_BOT } from "./env";
import { PollIsClosed, PollIsExpired, UserNotFound } from "./utils/exceptionsUtils";
import { commands, createMention, exceptionsHandler, timeCommand, wrapBotMessage } from "./utils/botUtils";

const logger = Logger("bot");

const groupSerivce = new GroupService();
const locationService = new LocationSerivce();
const userService = new UserService();
const pollService = new PollService();
const trackService = new TrackService();

const lockPollCache = new AsyncLock();

export default async function (bot: TelegramBot) {
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

    const listCommandsBasic: TelegramBot.BotCommand[] = [{ command: commands.IMPOSTOR, description: "If someone has cheated to earn points even though they didn't go out on their motorcycle or didn't get caught in the rain, you can report it." }];

    //set commands for administrators
    bot.setMyCommands([
        ...listCommandsBasic,
        { command: commands.SET_LOCATION, description: "Set a location where you want to receive weather updates." },
        { command: commands.SET_DAYS, description: "Manage the days of the week to receive weather updates." },
        { command: commands.SET_ENABLE, description: "Manage whether to suspend the bot." },
        { command: commands.SET_START_TIME_GUARDIAN, description: "Check the weather only from the time you set onward." },
        { command: commands.SET_END_TIME_GUARDIAN, description: "Check the weather up to the time that was set." },
        { command: commands.SHOW_SETTINGS, description: "Show current settings." }
    ], {
        scope: {
            type: "all_chat_administrators"
        }
    });

    //set commands for everyone
    bot.setMyCommands(listCommandsBasic, {
        scope: {
            type: "all_group_chats"
        }
    });

    //debug
    wrapBotMessage(bot, async (message) => {
        logger.debug(JSON.stringify(message));
    });

    //permission only group
    wrapBotMessage(bot, async () => undefined, async (message) => {
        await bot.sendMessage(message.chat.id, "This bot can only be used in groups!");
    });

    //command location
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command({
            message,
            command: commands.SET_LOCATION,
            functionExecuteCommand: async (location) => {
                const findLocation = await locationService.exist(location);
                if (!_.isNil(findLocation)) {
                    await groupSerivce.edit(message.chat.id, {
                        latitude: findLocation.latitude,
                        longitude: findLocation.longitude,
                        location,
                        timezone: findLocation.timezone
                    });
                    await bot.sendMessage(message.chat.id, `Successfully updated the position "${location}" 📍`);
                } else {
                    await bot.sendMessage(message.chat.id, `I couldn't find the position "${location}"`);
                }
            },
            functionReadCommand: async () => {
                await bot.sendMessage(message.chat.id, "Enter the name of the city whose weather you want to monitor.\nExample: roma or Roma");
            }
        });
    });

    //command set days
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command({
            message,
            command: commands.SET_DAYS,
            functionExecuteCommand: async (day) => {
                day = day.replace(" ✅", "").replace(" ❌", "").toLowerCase();

                if (arrayDays.includes(day)) {
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

                    await bot.sendMessage(message.chat.id, `The ${day} is  ${group.days_trigger[currentIndex] ? "enabled" : "disabled"} for weather monitoring.`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else if (day === "Cancel") {
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
            functionReadCommand: async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id, "You can decide which days you want to receive weather updates.", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: [
                            [
                                { text: `Monday ${group.days_trigger[0] ? "✅" : "❌"}` },
                                { text: `Tuesday ${group.days_trigger[1] ? "✅" : "❌"}` },
                                { text: `Wednesday ${group.days_trigger[2] ? "✅" : "❌"}` }
                            ],
                            [
                                { text: `Thursday ${group.days_trigger[3] ? "✅" : "❌"}` },
                                { text: `Friday ${group.days_trigger[4] ? "✅" : "❌"}` },
                                { text: `Saturday ${group.days_trigger[5] ? "✅" : "❌"}` }
                            ],
                            [
                                { text: `Sunday ${group.days_trigger[6] ? "✅" : "❌"}` },
                                { text: "Cancel" }
                            ]
                        ]
                    }
                });
            }
        });
    });

    //command active/disactive bot for group
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command({
            message,
            command: commands.SET_ENABLE,
            functionExecuteCommand: async (enable) => {
                enable = enable.toLocaleLowerCase();

                if (enable === "✅" || enable === "❌") {
                    await groupSerivce.edit(message.chat.id, { enabled: enable === "✅" });

                    await bot.sendMessage(message.chat.id, `The bot has been ${enable === "✅" ? "actived" : "suspended"}.`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else if (enable === "Cancel") {
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
            functionReadCommand: async () => {
                const group = await groupSerivce.find(message.chat.id);

                await bot.sendMessage(message.chat.id, "You can decide whether to temporarily suspend the bot.", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: [
                            [{ text: `${!group.enabled ? "✅" : "❌"}` }],
                            [{ text: "Cancel" }]
                        ]
                    }
                });
            }
        });
    });

    //leave someone
    wrapBotMessage(bot, async (message) => {
        if (!_.isNil(message.left_chat_member)) {
            if (message.left_chat_member.is_bot) {
                if (message.left_chat_member.username === USERNAME_BOT) {
                    await groupSerivce.delete(message.chat.id);
                    const listIds = await userService.getIdsByChatId(message.chat.id);
                    await userService.deleteManyByChatId(message.chat.id);
                    await pollService.deleteByChatId(message.chat.id);
                    await trackService.deleteByChatId(message.chat.id);

                    userCacheUtils.userCache.del(userCacheUtils.getMultiplePrimaryKeyCompose(message.chat.id, listIds));

                    logger.info(`Someone kicked me out of the group id "${message.chat.id}"`);
                }
            } else {
                try {
                    await userService.deleteById(message.chat.id, message.left_chat_member.id);
                } catch (err) {
                    if (!(err instanceof UserNotFound)) {
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
        if (!_.isNil(message.new_chat_members)) {
            for (const new_chat_member of message.new_chat_members) {
                if (new_chat_member.is_bot) {
                    if (new_chat_member.username === USERNAME_BOT) {
                        const findMyBot = _.find(message.new_chat_members, { is_bot: true, username: USERNAME_BOT });

                        if (!_.isNil(findMyBot)) {
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
            if (!_.isNil(message.new_chat_title)) {
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
            } catch (err) {
                logger.error("Failed get data poll from cache, details:", err);
                return;
            }

            if (poll.type === "out" || poll.type === "out_x2") {
                await exceptionsHandler(bot, poll.group_id, async () => {
                    const user = await userCacheUtils.getUserCache(poll.group_id, pollAnswer.user.id, pollAnswer.user.username);

                    let points = 0;
                    let skipOut = false;

                    switch (poll.type) {
                    case "out":
                        if (pollAnswer.option_ids[0] === 0) {
                            points = 1;
                        } else {
                            skipOut = true;
                        }
                        break;
                    case "out_x2":
                        if (pollAnswer.option_ids[0] === 0) {
                            points = 2;
                        } else if (pollAnswer.option_ids[0] === 1) {
                            points = -2;
                        } else {
                            skipOut = true;
                        }
                        break;
                    }

                    if (points > 0) {
                        points *= user.scoreMultiplier + 1;
                    } else if (points < 0) {
                        points *= (user.scoreMultiplier || 1);
                    }

                    await userService.edit(user.chat_id, user.id, {
                        points: skipOut ? user.points : user.points + points,
                        scoreMultiplier: points > 0 ? user.scoreMultiplier + 1 : 0,
                        outWithBike: user.outWithBike + (skipOut ? 0 : 1),
                        skipOutWithBike: user.skipOutWithBike + (skipOut ? 1 : 0)
                    });

                    await pollService.answered(pollAnswer.poll_id, user.id);
                });
            } else if (poll.type === "impostor"){
                if (poll.target_impostor === pollAnswer.user.id && pollAnswer.option_ids[0] === 0){
                    await bot.sendMessage(poll.group_id, `Don't be cheeky "${pollAnswer.user.username}", your vote will not be counted.`);
                } else {
                    await pollService.answered(pollAnswer.poll_id, pollAnswer.user.id);
                }
            } else {
                logger.debug(`This poll id "${pollAnswer.poll_id}" is not type out so skip evalutate points for user id ${pollAnswer.user.id}`);
            }
        });
    });

    //command show settings
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command({
            message,
            command: commands.SHOW_SETTINGS,
            functionReadCommand: async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id,
                    `
Your current settings:
🤖 Bot is ${group.enabled ? "activated" : "suspended"}
📍 Location: ${group.location}
🕑 Time zone: ${group.timezone}
📅 Weather days check: ${arrayDays.filter((_, index) => group.days_trigger[index]).join(", ")}
💂 Time guardian: ${group.start_time_guardian} - ${group.end_time_guardian}
📝 Last update: ${!_.isNil(group.updated)? DateTime.fromJSDate(group.updated).setZone(group.timezone).toLocaleString(DateTime.DATETIME_SHORT) : "Never"}
`
                );
            }
        });
    });

    //command set start time guardian
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command({
            message,
            command: commands.SET_START_TIME_GUARDIAN,
            functionExecuteCommand: async (time) => {
                time = time.replace(" ✅", "");

                const group = await groupSerivce.find(message.chat.id);

                const checkFormatTime = /^(0[0-9]|1[0-9]|2[0-3]):00$/;

                if (checkFormatTime.test(time)) {
                    if (time > group.end_time_guardian) {
                        await bot.sendMessage(message.chat.id, `The start time cannot be later than ${group.end_time_guardian}`, { reply_markup: { remove_keyboard: true } });
                    } else {
                        await groupSerivce.edit(message.chat.id, {
                            start_time_guardian: time
                        });

                        await bot.sendMessage(message.chat.id, `Okay set to this time: "${time}"`, { reply_markup: { remove_keyboard: true } });
                    }
                } else if (time === "Cancel") {
                    await bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    await bot.sendMessage(message.chat.id, `Invalid format time "${time}", I only accept hours from 00 to 23.\nExample: HH:00`, { reply_markup: { remove_keyboard: true } });
                }
            },
            functionReadCommand: async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id, "Set the start time for weather checks", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: timeCommand(group.start_time_guardian)
                    }
                });
            }
        });
    });

    //command set end time guardian
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command({
            message,
            command: commands.SET_END_TIME_GUARDIAN,
            functionExecuteCommand: async (time) => {
                time = time.replace(" ✅", "");

                const group = await groupSerivce.find(message.chat.id);

                const checkFormatTime = /^(0[0-9]|1[0-9]|2[0-3]):00$/;

                if (checkFormatTime.test(time)) {
                    if (time < group.start_time_guardian) {
                        await bot.sendMessage(message.chat.id, `The end time cannot be earlier than ${group.start_time_guardian}`, { reply_markup: { remove_keyboard: true } });
                    } else {
                        await groupSerivce.edit(message.chat.id, {
                            end_time_guardian: time
                        });

                        await bot.sendMessage(message.chat.id, `Okay set to this time: "${time}"`, { reply_markup: { remove_keyboard: true } });
                    }
                } else if (time === "Cancel") {
                    await bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    await bot.sendMessage(message.chat.id, `Invalid format time "${time}", I only accept hours from 00 to 23.\nExample: HH:00`, { reply_markup: { remove_keyboard: true } });
                }
            },
            functionReadCommand: async () => {
                const group = await groupSerivce.find(message.chat.id);
                await bot.sendMessage(message.chat.id, "Set the end time for weather checks", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: timeCommand(group.end_time_guardian)
                    }
                });
            }
        });
    });

    //command impostor
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command({
            message,
            command: commands.IMPOSTOR,
            functionExecuteCommand: async (mention, messageReceived) => {
                if (_.isArray(messageReceived.entities) && messageReceived.entities.length > 0 && messageReceived.entities[0].type === "mention"){
                    const usernameImpostor = mention.replace("@", "");

                    let find: IUser | null = null;
                    try {
                        find = await userService.findByUsername(message.chat.id, usernameImpostor);
                    } catch (err){
                        if (!(err instanceof UserNotFound)){
                            throw err;
                        }
                    }

                    if (_.isNil(find)){
                        await bot.sendMessage(message.chat.id, `Not exist this user "${usernameImpostor}"`);
                        return;
                    }

                    if (!await pollService.checkTargetImpostor(message.chat.id, find.id)){
                        const messagePoll = await bot.sendPoll(
                            message.chat.id,
                            `This user "${usernameImpostor}" tried to cheat, would you like to report them as an impostor and remove the duplicate points they earned?`,
                            ["Yes", "No"],
                            {
                                is_anonymous: false
                            }
                        );

                        await pollService.create({
                            expire: DateTime.now().plus({seconds: POLLS_EXPIRE_IMPOSTOR_SECONDS}).toJSDate(),
                            group_id: message.chat.id,
                            id: messagePoll.poll.id,
                            message_id: messagePoll.message_id,
                            type: "impostor",
                            target_impostor: find.id
                        });
                    } else {
                        await bot.sendMessage(message.chat.id, `You have already started a pool with this impostor "${usernameImpostor}"`);
                    }
                } else {
                    await bot.sendMessage(message.chat.id, "Invalid mention");
                }
            },
            functionReadCommand: async () => {
                await bot.sendMessage(message.chat.id, "Who is the impostor? (You need to mention someone by starting with '@')");
            }
        });
    });

    bot.on("edited_message", async (message) => {
        logger.debug(JSON.stringify(message));

        await lockPollCache.acquire(message.chat.id.toString(), async () => {

            let poll: IPoll;
            try {
                poll = await pollCacheUtils.getPollCacheByGroupId(message.chat.id);
            } catch (err) {
                if (!(err instanceof PollIsClosed || err instanceof PollIsExpired)) {
                    logger.error("Failed get data poll from cache, details:", err);
                } else {
                    logger.warn(`The user id "${message.from.id}" is trying to send the positions, but the poll is already closed`);

                    try {
                        await bot.deleteMessage(message.chat.id, message.message_id);
                    } catch (err) {
                        logger.error(`Failed delete message from group id "${message.chat.id}", details:`, err);
                        return;
                    }

                    try {
                        await bot.sendMessage(message.chat.id, createMention({ first_name: message.from.first_name, user_id: message.from.id }, "At the moment, you can't share your location. There is no active poll right now."), { parse_mode: "MarkdownV2" });
                    } catch (err) {
                        logger.error(`Failed send message  from group id "${message.chat.id}", details:`, err);
                    }

                }
                return;
            }

            await exceptionsHandler(bot, message.chat.id, async () => {
                if (poll.stop === false && new Date() < poll.expire && !_.isNil(message.location) && poll.type !== "question") {
                    await trackService.addPositions(message.from.id, message.chat.id, poll.id, { positions: [{ lat: message.location.latitude, long: message.location.longitude, date: new Date(message.edit_date * 1000) }] });
                }
            });
        });
    });

    logger.info("Started!");
}