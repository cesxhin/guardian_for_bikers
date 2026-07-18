import _ from "lodash";
import geolib from "geolib";
import { CronJob } from "cron";
import { DateTime, Duration } from "luxon";
import { Message } from "node-telegram-bot-api";

import { bot } from "../index.ts";
import Logger from "../lib/logger.ts";
import { IUser } from "../domains/interfaces/IUser.ts";
import { IEvent } from "../domains/interfaces/IEvent.ts";
import { RequireNonNullable } from "../utils/tsUtils.ts";
import { CRON_EVENT, POLL_EXPIRE_ACTION_SECONDS } from "../env.ts";
import { UserService } from "../applications/services/userService.ts";
import { TrackService } from "../applications/services/trackService.ts";
import { EventService } from "../applications/services/eventService.ts";
import { GroupService } from "../applications/services/groupService.ts";
import { calculateScoreMultiplier, exceptionsHandler, RESPONSIBILITY_POLICY } from "../utils/botUtils.ts";

const logger = Logger("cron-event");

const eventService = new EventService();
const userService = new UserService();
const trackService = new TrackService();
const groupService = new GroupService();

export default () => {
    new CronJob(
        CRON_EVENT,
        async () => {
            logger.info("Check events...");

            const listEvents = await eventService.listExpired();

            logger.debug(`Found total events ${listEvents.length}`);

            for (const event of listEvents) {
                await exceptionsHandler(
                    event.group_id,
                    async () => {
                        logger.debug(`Current event id "${event._id}" of group id "${event.group_id}"`);
                        
                        //poll di tipo question
                        if (event.type == "question"){

                            //if vote is positive
                            if (event.answered.length >= 1){
                                const group = await groupService.find(event.group_id);

                                //disable old event
                                await eventService.edit(event._id, {
                                    stop: true
                                });

                                //set expire event for generate poll
                                const endTime = Duration.fromISOTime(group.end_time_guardian);
                                const expire = DateTime.now().set({hour: endTime.hours, minute: endTime.minutes, millisecond: 0, second: 0});
                                
                                //create new event
                                await eventService.create({
                                    group_id: event.group_id,
                                    type: "out_x2",
                                    poll_id: null,
                                    expire_poll: null,
                                    expire: expire.toJSDate()
                                });

                                await bot.sendMessage(event.group_id, "Okay! I'll keep it in mind when reviewing the survey at the end of the day.");
                            } else {
                                //disable event
                                await eventService.edit(event._id, {
                                    stop: true
                                });

                                await bot.sendMessage(event.group_id, "Better this way bikers, go out by car or stay home and relax");
                            }
                        } else if (event.type === "out" || event.type === "out_x2") {
                            if (_.isNil(event.expire_poll)){

                                let newPoll: Message;
                                if (event.type === "out"){
                                    newPoll = await bot.sendPoll(
                                        event.group_id,
                                        "Who's out?",
                                        [{text: "I went out"}, {text: "No"}],
                                        {
                                            is_anonymous: false,
                                            open_period: POLL_EXPIRE_ACTION_SECONDS
                                        }
                                    );
                                } else {
                                    newPoll = await bot.sendPoll(
                                        event.group_id,
                                        "At your own risk, it might rain, how did it go in the end?"+RESPONSIBILITY_POLICY,
                                        [
                                            {text: "I went out without getting wet"},
                                            {text: "I went out but got wet"},
                                            {text: "I didn't go out"}
                                        ],
                                        { is_anonymous: false, open_period: POLL_EXPIRE_ACTION_SECONDS }
                                    );
                                }

                                if (!_.isNil(newPoll.poll?.id)){
                                    await eventService.edit(event._id, {
                                        expire_poll: DateTime.fromJSDate(event.expire).plus({seconds: POLL_EXPIRE_ACTION_SECONDS}).set({ second: 0, millisecond: 0 }).toJSDate(),
                                        poll_id: newPoll.poll.id
                                    });
                                } else {
                                    logger.error("Failed get poll id for event out");
                                }
                            } else {
                                await answer(event as Pick<IEvent, "_id" | "group_id"> & RequireNonNullable<IEvent, "poll_id">, event.answered);
                            }
                        } else if (event.type === "impostor"){
                            //todo magari farlo ritornare un numero totale senza dover sprecare le risorse
                            const users = await userService.findManyByGroupId(event.group_id);

                            const userImpostor: IUser | undefined = _.find(users, { id: event.target_impostor });
                            const usernameImpostor = userImpostor?.username || "unkown (User does not exist, maybe they left the group)";

                            if (event.answered.length != 0 && (event.answered.length + 1) === users.length){
                                await bot.sendMessage(event.group_id, `You found the imposter! It's "${usernameImpostor}", therefore their points and point multipliers have been reset!`);

                                if (!_.isNil(userImpostor)){
                                    await userService.edit(event.group_id, event.target_impostor, {points: 0, consecutive: 0, totalImpostor: userImpostor.totalImpostor + 1});
                                }
                            } else {
                                await bot.sendMessage(event.group_id, `The voting has been closed and did not meet the minimum requirements to report '${usernameImpostor}' as an impostor.`);
                            }

                            await eventService.edit(event._id, { stop: true });
                        }
                    }
                );
            }

            logger.info("Finish check polls");
        },
        null,
        true,
        DateTime.local().zoneName
    );
    
    logger.info("Started!");
};

async function answer(event: Pick<IEvent, "_id" | "group_id"> & RequireNonNullable<IEvent, "poll_id">, answered: number[]){
    //close poll
    await eventService.edit(event._id, { stop: true });

    //reset score multiplicator who didn't answer poll
    await userService.resetScoreMultiplerNotAnswered(event.group_id, answered);

    //get all list users from groups
    const users = await userService.findManyByGroupId(event.group_id);

    //get all tracks closed
    const listTracks = await trackService.findByEventId(event._id.toString());

    logger.debug("Found total tracks: ", listTracks.length);

    //calculate distance
    let distanceTotal: number;
    let calculatedKm: number;
    let messageDistanceToday = "";
    let findUser: IUser | undefined;
    for (const track of listTracks) {
        distanceTotal = 0;

        track.positions.forEach((value, index) => {
            const position = track.positions[index + 1];
            
            if ((index + 1) === track.positions.length || _.isNil(position)){
                return;
            }

            distanceTotal += geolib.getPreciseDistance({lat: value.lat, lon: value.long}, {lat: position.lat, lon: position.long});
        });

        let totalTime = 0;
        if (track.positions.length > 0){
            const minTime = _.minBy(track.positions, (position) => position.date);
            const maxTime = _.maxBy(track.positions, (position) => position.date);

            if (!_.isNil(minTime) && !_.isNil(maxTime)){
                totalTime = DateTime.fromJSDate(maxTime.date).diff(DateTime.fromJSDate(minTime.date)).toMillis();
            }
        }

        if (distanceTotal > 0){
            calculatedKm = parseFloat((distanceTotal / 1000).toFixed(2));

            logger.debug(`This track "${track.user_id}, ${track.group_id}, ${track.event_id}" covered these kilometers ${calculatedKm}`);
            
            await trackService.edit(track.user_id, track.group_id, track.event_id, { totalKm: calculatedKm, totalTime, positions: [], terminate: true });

            findUser = _.find(users, {id: track.user_id});

            if (!_.isNil(findUser) && calculatedKm > 0){
                messageDistanceToday += `${findUser.username}: ${calculatedKm} km - ${Duration.fromMillis(totalTime).toISOTime({ suppressMilliseconds: true })} \n`;
                
                await userService.edit(findUser.chat_id, findUser.id, { totalKm: findUser.totalKm + calculatedKm });
            } else {
                logger.error(`not found user id "${track.user_id}" from group id "${track.group_id}"`);
            }
        } else {
            logger.warn(`This user "${track.user_id}" not have more 1 position or the distance is equal zero. Therefore, the track will be cancelled.`);
            await trackService.deleteByIds(track.user_id, track.group_id, track.event_id);
        }
    }

    //print message distance
    if (!_.isEmpty(messageDistanceToday)){
        await bot.sendMessage(event.group_id, "Summary of kilometers traveled today!\n\n" + messageDistanceToday);
    }

    let message = "The poll has been closed!\nLet's see the ranking right now!\n";

    let rank = 1;
    for (const user of users.sort((userA, userB) => userB.points - userA.points)) {
        message += `${rank === 1? "🥇" : rank === 2? "🥈" : rank === 3? "🥉" : rank.toString().padStart(3, " ") + "  "} ➜ ${user.username}: ${user.points} PT (${calculateScoreMultiplier(user.consecutive)}x)\n`;
        rank++;
    }

    await bot.sendMessage(event.group_id, message);
}