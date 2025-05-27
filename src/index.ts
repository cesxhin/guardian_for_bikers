import TelegramBot from "node-telegram-bot-api";
import { TOKEN_BOT, URL_MONGO, USERNAME_BOT } from "./env";
import _ from "lodash";
import Logger from "./lib/logger";
import { WeatherService } from "./services/weatherService";
import { onlyPermissionGroup } from "./utils/botUtils";
import mongoose from "mongoose";
import { GroupService } from "./services/groupService";
import { LocationSerivce } from "./services/locationService";

const logger = Logger("main");
const weatherService = new WeatherService();
const groupSerivce = new GroupService();
const locationService = new LocationSerivce();

if(_.isNil(TOKEN_BOT)){
    logger.error("Missing token bot");
    process.exit(1);
}

if(_.isNil(USERNAME_BOT)){
    logger.error("Missing username bot");
    process.exit(1);
}

async function main(){

    //mongo
    logger.debug("Try connect to mongo with this url: "+URL_MONGO);
    try{
        await mongoose.connect(URL_MONGO);
    }catch(err){
        logger.error("Failed connect to mongo, details:", err);
        process.exit(1);
    }
    logger.info("Mongo connected!");

    //telegram
    let bot: TelegramBot;
    try{
        bot = new TelegramBot(TOKEN_BOT, { polling: true });
    }catch(err){
        logger.error("Error telegram bot, details:", err);
        process.exit(1);
    }
    logger.info("Bot started!");
    
    listenersBot(bot);
}

function listenersBot(bot: TelegramBot){
    enum commands {
        SET_LOCATION = "set_location"
    }
    //init command
    bot.setMyCommands([
        { command: commands.SET_LOCATION, description: "set the desired location to monitor the weather" }
    ]);

    bot.on('message', async (message) => {
        logger.debug(JSON.stringify(message));
    
        if(onlyPermissionGroup(message)){
            //add self me to group
            if(!_.isNil(message.new_chat_members) && message.new_chat_members.length > 0){
                const findMyBot = _.find(message.new_chat_members, {is_bot: true, username: USERNAME_BOT});
    
                if(!_.isNil(findMyBot)){
                    await groupSerivce.create(message.chat.id);
                    bot.sendMessage(message.chat.id, `Hello bikers! 🏍️\n\nFrom now on I will be your guardian for bad weather.\n\nWhat can this bot do?\n\nOnce you have set the area you want to monitor, if there is bad weather I'm sorry bikers it's better for you to stay home but if the weather is good it's time to go out!\n\nThere is a ranking of who goes out the most, go bikers! 🏍️🏍️🏍️`)
                }
            //command location
            }else if(message.text?.startsWith(`/${commands.SET_LOCATION}@${USERNAME_BOT}`)){
                const location = message.text.split(`/${commands.SET_LOCATION}@${USERNAME_BOT}`)[1].trim();

                if(location.length == 0){
                    bot.sendMessage(message.chat.id, "The name of the location is missing");
                }else{
                    if(await locationService.exist(location)){
                        groupSerivce.edit(message.chat.id, {
                            location: location.toLowerCase().trim()
                        })
                        bot.sendMessage(message.chat.id, `Updated location current: ${location}`);
                    }else{
                        bot.sendMessage(message.chat.id, `Location not recognized "${location}"`);
                    }
                }
            //leave someone
            }else if(!_.isNil(message.left_chat_member)){
                if(message.left_chat_member.is_bot && message.left_chat_member.username === USERNAME_BOT){
                    await groupSerivce.delete(message.chat.id);
                }
                //TODO eliminare un utente se è uscito
            }
        }else if(message.text === "/start"){
            bot.sendMessage(message.chat.id, "I can only use in groups!")
        }
    });
    
    bot.on('poll_answer', (message) => {
        logger.debug(JSON.stringify(message));
    });
}

try{
    await main();
}catch(err){
    logger.error("Generic error not handled, details:", err)
}