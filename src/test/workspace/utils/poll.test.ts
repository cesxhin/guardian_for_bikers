import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import polldata from "../../data/eventData.ts";
import eventCacheUtils from "../../../utils/eventCacheUtils.ts";
import { modelEvent } from "../../../domains/models/eventModel.ts";

vi.mock(import("../../../env.ts"), () => {
    return {
        USERNAME_BOT: "bot",
        POLLS_CACHE_EXPIRE: 1,
        POLLS_CACHE_CHECK_PERIOD: 1
    };
});

describe("bot-utils", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelEvent.insertMany(polldata);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });
    
    describe("method: getPollCache", () => {
        it("create cache and clear cache", async () => {
            const callback = vi.fn();

            eventCacheUtils.pollCache.once("set", callback);

            await eventCacheUtils.getPollCache("poll-1");

            expect(callback).toHaveBeenCalled();

            const callbackDel = vi.fn();
            eventCacheUtils.pollCache.once("del", callbackDel);

            await new Promise((resolve) => setTimeout(resolve, 2000));

            expect(callbackDel).toHaveBeenCalled();
        });
        
        it("get cache", async () => {
            await eventCacheUtils.getPollCache("poll-1");

            const callback = vi.fn();
            eventCacheUtils.pollCache.once("set", callback);
            await eventCacheUtils.getPollCache("poll-1");

            expect(callback).not.toHaveBeenCalled();
        });
    });
});