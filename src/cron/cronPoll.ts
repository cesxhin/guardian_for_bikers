import _ from "lodash";
import geolib from "geolib";
import { CronJob } from "cron";
import { DateTime, Duration } from "luxon";
import TelegramBot from "node-telegram-bot-api";

import Logger from "../lib/logger";
import { IUser } from "../domains/interfaces/IUser";
import { PollService } from "../services/pollService";
import { exceptionsHandler } from "../utils/botUtils";
import { UserService } from "../services/userService";
import { TrackService } from "../services/trackService";
import { CRON_POLL, POLLS_EXPIRE_ACTION_SECONDS } from "../env";

const logger = Logger("cron-poll");

const pollService = new PollService();
const userService = new UserService();
const trackService = new TrackService();

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
                                    expire: DateTime.now().plus({ seconds: POLLS_EXPIRE_ACTION_SECONDS }).set({millisecond: 0, second: 0}).toJSDate(),
                                    target_impostor: null
                                });
                            } else {
                                await bot.sendMessage(poll.group_id, "Better this way bikers, go out by car or stay home and relax");
                            }
                        } else if (poll.type === "out_x2" || poll.type === "out") {
                            //close poll
                            await pollService.edit(poll.id, { stop: true });

                            //reset score multiplicator who didn't answer poll
                            await userService.resetScoreMultiplerNotAnswered(poll.group_id, poll.answered);

                            //get all list users from groups
                            const users = await userService.findManyByGroupId(poll.group_id);

                            //close all tracks
                            await trackService.terminateAllFromPollId(poll.id);

                            //get all tracks closed
                            const listTracks = await trackService.findAllTermintedFromPollId(poll.id);

                            logger.debug("Found total tracks: ", listTracks.length);

                            //calculate distance
                            let distanceTotal: number;
                            let calculatedKm: number;
                            let messageDistanceToday = "";
                            let findUser: IUser | null;
                            for (const track of listTracks) {
                                distanceTotal = 0;

                                track.positions.forEach((value, index) => {
                                    if ((index + 1) === track.positions.length){
                                        return;
                                    }

                                    distanceTotal += geolib.getPreciseDistance({lat: value.lat, lon: value.long}, {lat: track.positions[index + 1].lat, lon: track.positions[index + 1].long});
                                });

                                let totalTime = 0;
                                if (track.positions.length > 0){
                                    const minTime = _.minBy(track.positions, (position) => position.date);
                                    const maxTime = _.maxBy(track.positions, (position) => position.date);

                                    totalTime = DateTime.fromJSDate(maxTime.date).diff(DateTime.fromJSDate(minTime.date)).toMillis();
                                }

                                if (distanceTotal > 0){
                                    calculatedKm = parseFloat((distanceTotal / 1000).toFixed(2));

                                    logger.debug(`This track "${track.user_id}, ${track.group_id}, ${track.poll_id}" covered these kilometers ${calculatedKm}`);
                                    
                                    await trackService.edit(track.user_id, track.group_id, track.poll_id, { totalKm: calculatedKm, totalTime });

                                    findUser = _.find(users, {id: track.user_id});

                                    if (!_.isNil(findUser) && calculatedKm > 0){
                                        messageDistanceToday += `${findUser.username}: ${calculatedKm} km - ${Duration.fromMillis(totalTime).toISOTime({ suppressMilliseconds: true })} \n`;
                                        
                                        await userService.edit(findUser.chat_id, findUser.id, { totalKm: findUser.totalKm + calculatedKm });
                                    } else {
                                        logger.error(`not found user id "${track.user_id}" from group id "${track.group_id}"`);
                                    }
                                } else {
                                    logger.warn(`This user "${track.user_id}" not have more 1 position or the distance is equal zero. Therefore, the track will be cancelled.`);
                                    await trackService.deleteByIds(track.user_id, track.group_id, track.poll_id);
                                }
                            }

                            //find users unknown distances
                            const listUserIdDistance = listTracks.map((track) => track.user_id);
                            const unknownDistanceUsers = _.filter(users, (user) => !listUserIdDistance.includes(user.id));
                            for (const user of unknownDistanceUsers) {
                                messageDistanceToday += `${user.username}: Location not shared\n`;
                            }

                            //print message distance
                            if (!_.isEmpty(messageDistanceToday)){
                                await bot.sendMessage(poll.group_id, "Summary of kilometers traveled today!\n\n" + messageDistanceToday);
                            }

                            let message = "The poll has been closed!\nLet's see the ranking right now!\n";

                            let rank = 1;
                            for (const user of users.sort((userA, userB) => userB.points - userA.points)) {
                                message += `${rank === 1? "🥇" : rank === 2? "🥈" : rank === 3? "🥉" : rank.toString().padStart(3, " ") + "  "} ➜ ${user.username}: ${user.points} PT (${user.scoreMultiplier}x)\n`;
                                rank++;
                            }

                            await bot.sendMessage(poll.group_id, message);
                            await trackService.removeAllPositionsByPollId(poll.id);
                        } else if (poll.type === "impostor"){
                            const users = await userService.findManyByGroupId(poll.group_id);

                            const userImpostor: IUser | null = _.find(users, { id: poll.target_impostor });
                            const usernameImpostor = userImpostor.username || "unkown (User does not exist, maybe they left the group)";

                            if (poll.answered.length != 0 && (poll.answered.length + 1) === users.length){
                                await bot.sendMessage(poll.group_id, `You found the imposter! It's "${usernameImpostor}", therefore their points and point multipliers have been reset!`);

                                if (!_.isNil(userImpostor)){
                                    await userService.edit(poll.group_id, poll.target_impostor, {points: 0, scoreMultiplier: 0, totalImpostor: userImpostor.totalImpostor + 1});
                                }
                            } else {
                                await bot.sendMessage(poll.group_id, `The voting has been closed and did not meet the minimum requirements to report '${usernameImpostor}' as an impostor.`);
                            }

                            await pollService.edit(poll.id, { stop: true });
                            await pollService.deleteByIds([poll.id]);
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