import _ from "lodash";
import NodeCache from "node-cache";

import Logger from "../lib/logger";
import { POLLS_EXPIRE_SECONDS } from "../env";
import { IPoll } from "../domains/interfaces/IPoll";
import { PollService } from "../services/pollService";

const logger = Logger("poll-cache");
const pollService = new PollService();
const pollCache = new NodeCache({
    stdTTL: POLLS_EXPIRE_SECONDS,
    checkperiod: 300 //5 minutes
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

async function getPollCache(id: string): Promise<IPoll>{
    if (pollCache.has(id)){
        return pollCache.get(id) as IPoll;
    } else {
        const poll = await pollService.findById(id);
        pollCache.set(poll.id, poll);

        return poll;
    }
}

async function getPollCacheByGroupId(group_id: number): Promise<IPoll>{
    const find: IPoll | null = _.find(Object.values(pollCache.mget(pollCache.keys())), { group_id, stop: false} satisfies Pick<IPoll, "group_id" | "stop">) as any;

    if (!_.isNil(find) && new Date() < find.expire){
        return find;
    } else {
        const poll = await pollService.findValidByGroupId(group_id);
        pollCache.set(poll.id, poll);

        return poll;
    }
}

export default {
    getPollCache,
    getPollCacheByGroupId,
    pollCache
};