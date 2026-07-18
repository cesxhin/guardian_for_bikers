import z from "zod";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import pollData from "../../data/eventData.ts";
import { IEvent, schemaEvent } from "../../../domains/interfaces/IEvent.ts";
import { modelEvent } from "../../../domains/models/eventModel.ts";
import eventCacheUtils from "../../../utils/eventCacheUtils.ts"; //fix
import { EventService } from "../../../applications/services/eventService.ts";
import { PollConflict, PollIsClosed, PollIsExpired } from "../../../utils/exceptionsUtils.ts";
import eventData from "../../data/eventData.ts";

describe("event-service", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const eventService = new EventService();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelEvent.insertMany(pollData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: listExpired", () => {
        it("find list event", async () => {
            const listPoll = await eventService.listExpired();

            expect(listPoll.length).toBeGreaterThan(0);
            
            for (const poll of listPoll) {
                await expect(z.parseAsync(schemaEvent, poll)).resolves.toBeDefined();
            }
        });
    });

    describe("method: checkTargetImpostor", () => {
        it("find event", async () => {
            await expect(eventService.checkTargetImpostor(1, 1)).resolves.toBeDefined();
        });
    });

    describe("method: findById", () => {
        it("find event", async () => {
            const event = await eventService.findById((eventData[0] as IEvent)._id);

            await expect(z.parseAsync(schemaEvent, event)).resolves.toBeDefined();
        });
    });

    describe("method: findByPollId", () => {
        it("find poll id", async () => {
            const poll = await eventService.findByPollId("poll-1");

            await expect(z.parseAsync(schemaEvent, poll)).resolves.toBeDefined();
        });
    });

    describe("method: findValidByGroupId", () => {
        it("find event valid", async () => {
            const event = await eventService.findValidByGroupId(1);
            
            await expect(z.parseAsync(schemaEvent, event)).resolves.toBeDefined();
        });

        it("event expire", async () => {
            await expect(eventService.findValidByGroupId(3)).rejects.toThrow(PollIsExpired);
        });
        
        it("event already stop", async () => {
            await expect(eventService.findValidByGroupId(5)).rejects.toThrow(PollIsClosed);
        });
    });

    describe("method: create", () => {
        it("create event", async () => {
            const event = await eventService.create({
                poll_id: "poll-create-1",
                group_id: 1,
                target_impostor: 1,
                type: "impostor",
                expire_poll: new Date()
            });
            
            await expect(z.parseAsync(schemaEvent, event)).resolves.toBeDefined();
            await expect(z.parseAsync(schemaEvent, eventCacheUtils.pollCache.get(event.poll_id as string))).resolves.toBeDefined();
        });

        it("conflict poll id", async () => {
            await expect(eventService.create({
                poll_id: "poll-1",
                group_id: 1,
                target_impostor: 1,
                type: "impostor",
                expire_poll: new Date()
            })).rejects.toThrow(PollConflict);
            
            expect(eventCacheUtils.pollCache.get("poll-1")).toBeUndefined();
        });
    });

    describe("method: deleteByGroupId", () => {
        it("remove event", async () => {
            const event = await eventService.create({
                poll_id: "poll-delete-group",
                group_id: -1,
                target_impostor: -1,
                type: "impostor",
                expire_poll: new Date()
            });
            
            expect(eventCacheUtils.pollCache.get(event.poll_id as string)).toBeDefined();
            await expect(eventService.deleteByGroupId(-1)).resolves.toBeUndefined();
            expect(eventCacheUtils.pollCache.get(event.poll_id as string)).toBeUndefined();
        });
    });

    describe("method: deleteByIds", () => {
        it("remove many event", async () => {
            const event = await eventService.create({
                poll_id: "poll-delete-group",
                group_id: -1,
                target_impostor: -1,
                type: "impostor",
                expire_poll: new Date()
            });
            
            expect(eventCacheUtils.pollCache.get(event.poll_id as string)).toBeDefined();
            await expect(eventService.deleteByIds([event._id])).resolves.toBeUndefined();
            expect(eventCacheUtils.pollCache.get(event.poll_id as string)).toBeUndefined();
        });
    });

    describe("method: answered", () => {
        it("find event", async () => {
            const event = await eventService.create({
                poll_id: "poll-answered-group",
                group_id: -1,
                target_impostor: -1,
                type: "impostor",
                expire_poll: new Date()
            });

            await new Promise((resolve) => setTimeout(resolve, 25));

            const pollAnswred = await eventService.answered(event.poll_id as string, 1);

            await expect(z.parseAsync(schemaEvent, pollAnswred)).resolves.toBeDefined();

            //check field update
            expect(pollAnswred.updated).not.toBeNull();
            expect(pollAnswred.updated?.getTime()).not.eq(event.updated?.getTime());
            expect(pollAnswred.updated?.getTime()).not.eq(pollAnswred.created?.getTime());
        });
    });

    describe("method: edit", () => {
        it("find event", async () => {
            const event = await eventService.create({
                poll_id: "poll-edit-group",
                group_id: -1,
                target_impostor: -1,
                type: "impostor",
                expire_poll: new Date()
            });

            await new Promise((resolve) => setTimeout(resolve, 25));

            const pollEdited = await eventService.edit(event._id, {stop: true});

            await expect(z.parseAsync(schemaEvent, pollEdited)).resolves.toBeDefined();
            expect(eventCacheUtils.pollCache.get(pollEdited.poll_id as string)).toEqual(pollEdited);

            //check field update
            expect(pollEdited.updated).not.toBeNull();
            expect(pollEdited.updated?.getTime()).not.eq(event.updated?.getTime());
            expect(pollEdited.updated?.getTime()).not.eq(pollEdited.created?.getTime());
        });
    });
});