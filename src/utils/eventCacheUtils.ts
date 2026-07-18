import _ from "lodash";
import NodeCache from "node-cache";

import Logger from "../lib/logger.ts";
import cacheUtils from "./cacheUtils.ts";
import { IEvent } from "../domains/interfaces/IEvent.ts";
import { EventService } from "../applications/services/eventService.ts";
import { POLLS_CACHE_CHECK_PERIOD, POLLS_CACHE_EXPIRE } from "../env.ts";

const logger = Logger("poll-cache");
const eventService = new EventService();
const pollCache = new NodeCache({
    stdTTL: POLLS_CACHE_EXPIRE,
    checkperiod: POLLS_CACHE_CHECK_PERIOD
});

pollCache.on("set", (key) => {
    logger.info(`Set poll id "${key}" to cache`);
});
pollCache.on("del", (key) => {
    logger.info(`Delete poll id "${key}" from cache`);
});
pollCache.on("expired", (key) => {
    logger.info(`Expired poll id "${key}" from cache so it will delete`);
});

async function getPollCache(pollId: string): Promise<IEvent>{
    return await cacheUtils.getCache<IEvent>(pollCache, pollId, async () => await eventService.findByPollId(pollId));
}

async function getPollCacheByGroupId(gropuId: number): Promise<IEvent>{
    const find: IEvent | null = _.find(Object.values(pollCache.mget(pollCache.keys())), { group_id: gropuId, stop: false} satisfies Pick<IEvent, "group_id" | "stop">) as any;

    //todo da verificare questo punto
    if (!_.isNil(find)/* &&  new Date() < find.expire*/){
        return find;
    } else {
        const poll = await eventService.findValidByGroupId(gropuId);
        pollCache.set(poll._id.toString(), poll);

        return poll;
    }
}

export default {
    getPollCache,
    getPollCacheByGroupId,
    pollCache
};