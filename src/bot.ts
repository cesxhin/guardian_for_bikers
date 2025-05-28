import _ from "lodash";
import TelegramBot from "node-telegram-bot-api";

import Logger from "./lib/logger";
import { USERNAME_BOT } from "./env";
import commandsUtils from "./utils/commandsUtils";
import { GroupService } from "./services/groupService";
import { WeatherService } from "./services/weatherService";
import {commands, wrapBotMessage } from "./utils/botUtils";
import { LocationSerivce } from "./services/locationService";

const logger = Logger("bot");

const weatherService = new WeatherService();
const groupSerivce = new GroupService();
const locationService = new LocationSerivce();

export default function (bot: TelegramBot){
    //init command
    bot.setMyCommands([
        { command: commands.SET_LOCATION, description: "Set the desired location to monitor the weather" },
        { command: commands.SET_DAYS, description: "Activate or deactivate the day you want to be monitored" },
        { command: commands.SET_ENABLE, description: "Activate or deactivate bot" }
    ]);

    //debug
    wrapBotMessage(bot, async (message) => {
        logger.debug(JSON.stringify(message));
    })

    //permission only group
    wrapBotMessage(bot, () => null, async (message) => {
        if(message.text.startsWith("/start")){
            bot.sendMessage(message.chat.id, "I can only use in groups!")
        }
    })

    //check exist group to db
    wrapBotMessage(bot, async (message) => {
        if(!_.isNil(message.new_chat_members) && message.new_chat_members.length > 0){
            const findMyBot = _.find(message.new_chat_members, {is_bot: true, username: USERNAME_BOT});

            if(!_.isNil(findMyBot)){
                await groupSerivce.create(message.chat.id);
                bot.sendMessage(message.chat.id, `Hello bikers! 🏍️\n\nFrom now on I will be your guardian for bad weather.\n\nWhat can this bot do?\n\nOnce you have set the area you want to monitor, if there is bad weather I'm sorry bikers it's better for you to stay home but if the weather is good it's time to go out!\n\nThere is a ranking of who goes out the most, go bikers! 🏍️🏍️🏍️`)
            }
        }
    })

    //command location
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_LOCATION,
            async (location) => {
                if(await locationService.exist(location)){
                    await groupSerivce.edit(message.chat.id, { location: location.toLowerCase().trim() });
                    bot.sendMessage(message.chat.id, `Updated location current: ${location}`);
                }else{
                    bot.sendMessage(message.chat.id, `Location not recognized "${location}"`);
                }
            },
            async () => {
                bot.sendMessage(message.chat.id, "Tell me the location");
            }
        )
    })
    
    //command set days
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_DAYS,
            async (day) => {
                day = day.replace(" ✅", "").replace(" ❌", "");

                if([
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                    "Sunday"
                ].includes(day)){
                    const group = await groupSerivce.find(message.chat.id);
                    
                    await groupSerivce.edit(message.chat.id, {
                        [day.toLocaleLowerCase()]: !group[day.toLocaleLowerCase()]
                    });
                    

                    bot.sendMessage(message.chat.id, `${!group[day]? 'Actived' : 'Deactivated' } ${day}`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                }else if(day === "Cancel"){
                    bot.sendMessage(message.chat.id, `Ok, I'm not doing anything`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    })
                }else{
                    bot.sendMessage(message.chat.id, `I can't recognize this "${day}" as the day of the week`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    })
                }
                
            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                bot.sendMessage(message.chat.id, "Active/Deactivated Days for Weather Control", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: [
                            [
                                {text: `Monday ${group.monday? '✅' : '❌' }`},
                                {text: `Tuesday ${group.tuesday? '✅' : '❌' }`},
                                {text: `Wednesday ${group.wednesday? '✅' : '❌' }`},
                            ],
                            [
                                {text: `Thursday ${group.thursday? '✅' : '❌' }`},
                                {text: `Friday ${group.friday? '✅' : '❌' }`},
                                {text: `Saturday ${group.saturday? '✅' : '❌' }`},
                            ],
                            [
                                {text: `Sunday ${group.sunday? '✅' : '❌' }`},
                                {text: "Cancel"}
                            ]
                        ]
                    }
                })
            }
        )
    })

    //command active/disactive bot for group
    wrapBotMessage(bot, async (message) => {
        commandsUtils.command(
            message,
            commands.SET_ENABLE,
            async (enable) => {
                if(enable === '✅' || enable === '❌'){
                    await groupSerivce.edit(message.chat.id, { enabled: enable === '✅' });

                    bot.sendMessage(message.chat.id, `${enable === '✅'? 'Actived' : 'Deactivated' } bot`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    });
                }else if(enable === 'Cancel'){
                    bot.sendMessage(message.chat.id, `Ok, I'm not doing anything`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    })
                }else{
                    bot.sendMessage(message.chat.id, `I can't recognize this "${enable}" for Active/Deactive bot`, {
                        reply_markup: {
                            remove_keyboard: true
                        }
                    })
                }

            },
            async () => {
                const group = await groupSerivce.find(message.chat.id);
                bot.sendMessage(message.chat.id, "Active/Deactivate bot", {
                    reply_markup: {
                        one_time_keyboard: true,
                        keyboard: [
                            [
                                {text: `${!group.enabled? '✅' : '❌' }`},
                            ],
                            [
                                {text: "Cancel"}
                            ]
                        ]
                    }
                })
            }
        );
    })

    //leave someone
    wrapBotMessage(bot, async (message) => {
        if(!_.isNil(message.left_chat_member)){
            if(message.left_chat_member.is_bot && message.left_chat_member.username === USERNAME_BOT){
                await groupSerivce.delete(message.chat.id);
            }
            //TODO eliminare un utente se è uscito
        }
    });
}