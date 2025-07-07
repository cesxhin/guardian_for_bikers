import { CronJob } from "cron";
import { DateTime } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger";
import { PollService } from "../services/pollService";
import { exceptionsHandler } from "../utils/botUtils";
import { CRON_POLL, POLLS_EXPIRE_ACTION_SECONDS } from "../env";
import { UserService } from "../services/userService";

const logger = Logger("cron-poll");

const pollService = new PollService();
const userService = new UserService();

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
                                    "At your own risk, it might rain, how did it go in the end?",
                                    [
                                        "I went out without getting wet",
                                        "I went out but got wet",
                                        "I didn't go out"
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
                                await bot.sendMessage(poll.group_id, "Better this way bikers, go out by car or stay home and relax");
                            }
                        } else {
                            await pollService.edit(poll.id, { stop: true });

                            const users = await userService.findManyByGroupId(poll.group_id);

                            let message = "The poll has been closed!\nLet's see the ranking right now!\n";

                            let rank = 1;
                            for (const user of users.sort((userA, userB) => userB.points - userA.points)) {
                                message += `${rank === 1? "🥇" : rank === 2? "🥈" : rank === 3? "🥉" : rank.toString().padStart(3, " ")} -> ${user.username}: ${user.points} PT\n`;
                                rank++;
                            }

                            await bot.sendMessage(poll.group_id, message);
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