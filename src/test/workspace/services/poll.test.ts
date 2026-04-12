import z from "zod";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import pollData from "../../data/pollData.ts";
import { schemaPoll } from "../../../domains/interfaces/IPoll.ts";
import { modelPoll } from "../../../domains/models/pollModel.ts";
import pollCacheUtils from "../../../utils/pollCacheUtils.ts"; //fix
import { PollService } from "../../../applications/services/pollService.ts";
import { PollConflict, PollIsClosed, PollIsExpired } from "../../../utils/exceptionsUtils.ts";

describe("poll-service", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const pollService = new PollService();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelPoll.insertMany(pollData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: listExpired", () => {
        it("find list poll", async () => {
            const listPoll = await pollService.listExpired();

            expect(listPoll.length).toBeGreaterThan(0);
            
            for (const poll of listPoll) {
                await expect(z.parseAsync(schemaPoll, poll)).resolves.toBeDefined();
            }
        });
    });

    describe("method: checkTargetImpostor", () => {
        it("find poll", async () => {
            await expect(pollService.checkTargetImpostor(1, 1)).resolves.toBeDefined();
        });
    });

    describe("method: findById", () => {
        it("find poll", async () => {
            const poll = await pollService.findById("poll-1");

            await expect(z.parseAsync(schemaPoll, poll)).resolves.toBeDefined();
        });
    });

    describe("method: findValidByGroupId", () => {
        it("find poll valid", async () => {
            const poll = await pollService.findValidByGroupId(1);
            
            await expect(z.parseAsync(schemaPoll, poll)).resolves.toBeDefined();
        });

        it("poll expire", async () => {
            await expect(pollService.findValidByGroupId(3)).rejects.toThrow(PollIsExpired);
        });
        
        it("poll already stop", async () => {
            await expect(pollService.findValidByGroupId(5)).rejects.toThrow(PollIsClosed);
        });
    });

    describe("method: create", () => {
        it("create poll", async () => {
            const poll = await pollService.create({
                id: "poll-create-1",
                group_id: 1,
                message_id: 1,
                target_impostor: 1,
                type: "impostor",
                expire: new Date()
            });
            
            await expect(z.parseAsync(schemaPoll, poll)).resolves.toBeDefined();
            await expect(z.parseAsync(schemaPoll, pollCacheUtils.pollCache.get(poll.id))).resolves.toBeDefined();
        });

        it("conflict poll", async () => {
            await expect(pollService.create({
                id: "poll-1",
                group_id: 1,
                message_id: 1,
                target_impostor: 1,
                type: "impostor",
                expire: new Date()
            })).rejects.toThrow(PollConflict);
            
            expect(pollCacheUtils.pollCache.get("poll-1")).toBeUndefined();
        });
    });

    describe("method: deleteByGroupId", () => {
        it("remove poll", async () => {
            const poll = await pollService.create({
                id: "poll-delete-group",
                group_id: -1,
                message_id: -1,
                target_impostor: -1,
                type: "impostor",
                expire: new Date()
            });
            
            expect(pollCacheUtils.pollCache.get(poll.id)).toBeDefined();
            await expect(pollService.deleteByGroupId(-1)).resolves.toBeUndefined();
            expect(pollCacheUtils.pollCache.get(poll.id)).toBeUndefined();
        });
    });

    describe("method: deleteByIds", () => {
        it("remove many poll", async () => {
            const poll = await pollService.create({
                id: "poll-delete-group",
                group_id: -1,
                message_id: -1,
                target_impostor: -1,
                type: "impostor",
                expire: new Date()
            });
            
            expect(pollCacheUtils.pollCache.get(poll.id)).toBeDefined();
            await expect(pollService.deleteByIds([poll.id])).resolves.toBeUndefined();
            expect(pollCacheUtils.pollCache.get(poll.id)).toBeUndefined();
        });
    });

    describe("method: answered", () => {
        it("find poll", async () => {
            const poll = await pollService.create({
                id: "poll-answered-group",
                group_id: -1,
                message_id: -1,
                target_impostor: -1,
                type: "impostor",
                expire: new Date()
            });
            const pollAnswred = await pollService.answered(poll.id, 1);

            await expect(z.parseAsync(schemaPoll, pollAnswred)).resolves.toBeDefined();

            //check field update
            expect(pollAnswred.updated).not.toBeNull();
            expect(pollAnswred.updated?.getTime()).not.eq(poll.updated?.getTime());
            expect(pollAnswred.updated?.getTime()).not.eq(pollAnswred.created?.getTime());
        });
    });

    describe("method: edit", () => {
        it("find poll", async () => {
            const poll = await pollService.create({
                id: "poll-edit-group",
                group_id: -1,
                message_id: -1,
                target_impostor: -1,
                type: "impostor",
                expire: new Date()
            });
            const pollEdited = await pollService.edit(poll.id, {stop: true});

            await expect(z.parseAsync(schemaPoll, pollEdited)).resolves.toBeDefined();
            expect(pollCacheUtils.pollCache.get(pollEdited.id)).toEqual(pollEdited);

            //check field update
            expect(pollEdited.updated).not.toBeNull();
            expect(pollEdited.updated?.getTime()).not.eq(poll.updated?.getTime());
            expect(pollEdited.updated?.getTime()).not.eq(pollEdited.created?.getTime());
        });
    });
});