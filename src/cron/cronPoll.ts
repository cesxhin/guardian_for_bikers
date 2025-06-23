import { CronJob } from "cron";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger";
import { PollService } from "../services/pollService";
import { exceptionsHandler } from "../utils/botUtils";
import { CRON_POLL, POLLS_EXPIRE_ACTION_SECONDS } from "../env";

const logger = Logger("cron-poll");

const pollService = new PollService();

export default (bot: TelegramBot) => {
    new CronJob(
        CRON_POLL,
        async () => {
            logger.info("Check polls...");

            const listPools = await pollService.listExpired();

            logger.debug(`Found total polls ${listPools.length}`);

            let resultPoll :TelegramBot.Poll;
            
            for (const poll of listPools) {
                await exceptionsHandler(
                    bot,
                    poll.group_id,
                    async () => {
                        logger.debug(`Current poll id "${poll.id}" of group id "${poll.group_id}"`);
                        
                        resultPoll = await bot.stopPoll(poll.group_id, poll.message_id);

                        if (poll.type == "question"){

                            if (resultPoll.options[0].voter_count > 1){
                                const newPoll = await bot.sendPoll(
                                    poll.group_id,
                                    "Do you really want to take the risk?\nThen the truly brave will deserve double points!\nDid you finally get out?",
                                    [
                                        "I went out without getting wet",
                                        "I went out but I took a lot of water",
                                        "No"
                                    ],
                                    { is_anonymous: false }
                                );

                                pollService.create({
                                    id: newPoll.poll.id,
                                    message_id: newPoll.message_id,
                                    group_id: poll.group_id,
                                    type: "out_x2",
                                    expire: DateTime.now().plus({ seconds: POLLS_EXPIRE_ACTION_SECONDS }).toJSDate()
                                });
                            } else {
                                await bot.sendMessage(poll.group_id, "Great bikers, great choice stay home! It will be better next time");
                            }
                        } else {
                            await pollService.edit(poll.id, { stop: true });
                        }
                    }
                );
            }

            //delete only pools questions old
            const listPoolsIdsQuestions = listPools.filter((pool) => pool.type === "question").map((pool) => pool.id);

            if (listPoolsIdsQuestions.length > 0){
                await pollService.deleteByIds(listPoolsIdsQuestions);
            }


            logger.info("Finish check polls");
        },
        null,
        true,
        DateTime.local().zoneName
    );
    
    logger.info("Started!");
};