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
        return pollCache.get(id);
    } else {
        const poll = await pollService.findById(id);
        pollCache.set(poll.id, poll);

        return poll;
    }
}

export default {
    getPollCache,
    pollCache
};