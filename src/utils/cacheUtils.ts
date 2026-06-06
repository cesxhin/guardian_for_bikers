import NodeCache from "node-cache";
import AsyncLock from "async-lock";

const lockPollCache = new AsyncLock();

async function getCache<T>(cache: NodeCache, key: string, action: () => Promise<T>): Promise<T>{
    if (cache.has(key)){
        return cache.get(key) as T;
    }

    return await lockPollCache.acquire<T>(key, async () => {
        if (cache.has(key)){
            return cache.get<T>(key);
        }

        const item = await action();

        cache.set(key, item);

        return item;
    });
}

export default {
    getCache
};