import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import polldata from "../../data/pollData.ts";
import pollCacheUtils from "../../../utils/pollCacheUtils.ts";
import { modelPoll } from "../../../domains/models/pollModel.ts";

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
        await modelPoll.insertMany(polldata);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });
    
    describe("method: getPollCache", () => {
        it("create cache and clear cache", async () => {
            const callback = vi.fn();

            pollCacheUtils.pollCache.once("set", callback);

            await pollCacheUtils.getPollCache("poll-1");

            expect(callback).toHaveBeenCalled();

            const callbackDel = vi.fn();
            pollCacheUtils.pollCache.once("del", callbackDel);

            await new Promise((resolve) => setTimeout(resolve, 2000));

            expect(callbackDel).toHaveBeenCalled();
        });
        
        it("get cache", async () => {
            await pollCacheUtils.getPollCache("poll-6");

            const callback = vi.fn();
            pollCacheUtils.pollCache.once("set", callback);
            await pollCacheUtils.getPollCache("poll-6");

            expect(callback).not.toHaveBeenCalled();
        });
    });
});