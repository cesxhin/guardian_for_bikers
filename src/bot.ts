import _ from "lodash";
import TelegramBot from "node-telegram-bot-api";

import Logger from "./lib/logger";
import { USERNAME_BOT } from "./env";
import commandsUtils from "./utils/commandsUtils";
import { GroupService } from "./services/groupService";
import {commands, exceptionsHandler, wrapBotMessage } from "./utils/botUtils";
import { LocationSerivce } from "./services/locationService";
import { UserNotFound } from "./utils/exceptionsUtils";
import { UserService } from "./services/userService";
import userCacheUtils from "./utils/userCacheUtils";

const logger = Logger("bot");

const groupSerivce = new GroupService();
const locationService = new LocationSerivce();
const userService = new UserService();

export default function (bot: TelegramBot){
    //init command
    bot.setMyCommands([
        { command: commands.SET_LOCATION, description: "Set the desired location to monitor the weather" },
        { command: commands.SET_DAYS, description: "Activate or deactivate the day you want to be monitored" },
        { command: commands.SET_ENABLE, description: "Activate or deactivate bot" },
        { command: commands.SET_TIME, description: "Set time for show information of the weather" }
    ]);

    //debug
    wrapBotMessage(bot, async (message) => {
        logger.debug(JSON.stringify(message));
    });

    //permission only group
    wrapBotMessage(bot, () => null, async (message) => {
        if (message.text.startsWith("/start")){
            bot.sendMessage(message.chat.id, "I can only use in groups!");
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
                    bot.sendMessage(message.chat.id, `Updated location current: ${location}`);
                } else {
                    bot.sendMessage(message.chat.id, `Location not recognized "${location}"`);
                }
            },
            async () => {
                bot.sendMessage(message.chat.id, "Tell me the location");
            }
        );
    });
    
    //command set days
    wrapBotMessage(bot, async (message) => {
        const arrayDays = [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
        ];

        commandsUtils.command(
            message,
            commands.SET_DAYS,
            async (day) => {
                day = day.replace(" ✅", "").replace(" ❌", "");

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
                    

                    bot.sendMessage(message.chat.id, `${group.days_trigger[currentIndex]? "Actived" : "Deactivated" } ${day}`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else if (day === "Cancel"){
                    bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    bot.sendMessage(message.chat.id, `I can't recognize this "${day}" as the day of the week`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                }
                
            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                bot.sendMessage(message.chat.id, "Active/Deactivated Days for Weather Control", {
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

                    bot.sendMessage(message.chat.id, `Okay set to this time: "${time}"`, { reply_markup: { remove_keyboard: true } });
                } else if (time === "Cancel"){
                    bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    bot.sendMessage(message.chat.id, `Invalid format time "${time}", I only accept hours from 00 to 23.\nExample: HH:00`, { reply_markup: { remove_keyboard: true } });
                }
            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                bot.sendMessage(message.chat.id, "Active/Deactivated Days for Weather Control", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: [
                            [
                                {text: `00:00 ${group.time_trigger == "00:00"? "✅" : "" }`},
                                {text: `01:00 ${group.time_trigger == "01:00"? "✅" : "" }`},
                                {text: `02:00 ${group.time_trigger == "02:00"? "✅" : "" }`},
                                {text: `03:00 ${group.time_trigger == "03:00"? "✅" : "" }`}
                            ],
                            [
                                {text: `04:00 ${group.time_trigger == "04:00"? "✅" : "" }`},
                                {text: `05:00 ${group.time_trigger == "05:00"? "✅" : "" }`},
                                {text: `06:00 ${group.time_trigger == "06:00"? "✅" : "" }`},
                                {text: `07:00 ${group.time_trigger == "07:00"? "✅" : "" }`}
                            ],
                            [
                                {text: `08:00 ${group.time_trigger == "09:00"? "✅" : "" }`},
                                {text: `09:00 ${group.time_trigger == "09:00"? "✅" : "" }`},
                                {text: `10:00 ${group.time_trigger == "10:00"? "✅" : "" }`},
                                {text: `11:00 ${group.time_trigger == "11:00"? "✅" : "" }`}
                            ],
                            [
                                {text: `12:00 ${group.time_trigger == "12:00"? "✅" : "" }`},
                                {text: `13:00 ${group.time_trigger == "13:00"? "✅" : "" }`},
                                {text: `14:00 ${group.time_trigger == "14:00"? "✅" : "" }`},
                                {text: `15:00 ${group.time_trigger == "15:00"? "✅" : "" }`}
                            ],
                            [
                                {text: `16:00 ${group.time_trigger == "16:00"? "✅" : "" }`},
                                {text: `17:00 ${group.time_trigger == "17:00"? "✅" : "" }`},
                                {text: `18:00 ${group.time_trigger == "18:00"? "✅" : "" }`},
                                {text: `19:00 ${group.time_trigger == "19:00"? "✅" : "" }`}
                            ],
                            [
                                {text: `20:00 ${group.time_trigger == "20:00"? "✅" : "" }`},
                                {text: `21:00 ${group.time_trigger == "21:00"? "✅" : "" }`},
                                {text: `22:00 ${group.time_trigger == "22:00"? "✅" : "" }`},
                                {text: `23:00 ${group.time_trigger == "23:00"? "✅" : "" }`}
                            ],
                            [{text: "Cancel"}]
                        ]
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
                if (enable === "✅" || enable === "❌"){
                    await groupSerivce.edit(message.chat.id, { enabled: enable === "✅" });

                    bot.sendMessage(message.chat.id, `${enable === "✅"? "Actived" : "Deactivated" } bot`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else if (enable === "Cancel"){
                    bot.sendMessage(message.chat.id, "Ok, I'm not doing anything", {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                } else {
                    bot.sendMessage(message.chat.id, `I can't recognize this "${enable}" for Active/Deactive bot`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                }

            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                bot.sendMessage(message.chat.id, "Active/Deactivate bot", {
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
                if(message.left_chat_member.username === USERNAME_BOT){
                    await groupSerivce.delete(message.chat.id);
                    const listIds = await userService.getIdsByChatId(message.chat.id);
                    await userService.deleteManyByChatId(message.chat.id);

                    userCacheUtils.userCache.del(userCacheUtils.getMultiplePrimaryKeyCompose(message.chat.id, listIds));

                    logger.info(`Someone kicked out of the group id "${message.chat.id}"`);
                }
            }else{
                try{
                    await userService.deleteById(message.left_chat_member.id);
                }catch(err){
                    if(!(err instanceof UserNotFound)){
                        throw err;
                    }else{
                        logger.error(`Not found user id "${message.left_chat_member.id}" for delete document user`);
                        return;
                    }
                }

                userCacheUtils.userCache.del(userCacheUtils.getPrimaryKeyCompose(message.chat.id, message.left_chat_member.id));
            }
        }
    });

    //check exist group to db
    wrapBotMessage(bot, async (message) => {
        if (!_.isNil(message.new_chat_members) && message.new_chat_members.length > 0){
        }
    });

    //entry someone
    wrapBotMessage(bot, async (message) => {
        if (!_.isNil(message.new_chat_members)){
            for (const new_chat_member of message.new_chat_members) {
                if (new_chat_member.is_bot){
                    if(new_chat_member.username === USERNAME_BOT){
                        const findMyBot = _.find(message.new_chat_members, {is_bot: true, username: USERNAME_BOT});

                        if (!_.isNil(findMyBot)){
                            await groupSerivce.create(message.chat.id, message.chat.title || "unknwon");
                            logger.info(`Someone added me to the group id "${message.chat.id}"`);
                            
                            bot.sendMessage(message.chat.id, "Hello bikers! 🏍️\n\nFrom now on I will be your guardian for bad weather.\n\nWhat can this bot do?\n\nOnce you have set the area you want to monitor, if there is bad weather I'm sorry bikers it's better for you to stay home but if the weather is good it's time to go out!\n\nThere is a ranking of who goes out the most, go bikers! 🏍️🏍️🏍️");
                        }
                    }
                }else{
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
    
    logger.info("Started!");
}