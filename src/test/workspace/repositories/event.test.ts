import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import eventData from "../../data/eventData.ts";
import { IEvent } from "../../../domains/interfaces/IEvent.ts";
import { modelEvent } from "../../../domains/models/eventModel.ts";
import { PollNotFound } from "../../../utils/exceptionsUtils.ts";
import { EventRepository } from "../../../applications/repository/eventRepository.ts";

describe("event-repository", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const eventRepository = new EventRepository();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelEvent.insertMany(eventData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: findById", () => {
        it("find event", async () => {
            await expect(eventRepository.findById((eventData[0] as IEvent)._id)).resolves.toMatchObject({
                poll_id: "poll-1"
            } satisfies Partial<IEvent>);
        });

        it("not find event", async () => {
            await expect(eventRepository.findById(new mongoose.Types.ObjectId())).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: checkTargetImpostor", () => {
        it("find impostor", async () => {
            await expect(eventRepository.checkTargetImpostor(1, 1)).resolves.toBe(true);
        });

        it("not find impostor with not exist group", async () => {
            await expect(eventRepository.checkTargetImpostor(-1, 1)).resolves.toBe(false);
        });

        it("not find impostor with not exist user", async () => {
            await expect(eventRepository.checkTargetImpostor(1, -1)).resolves.toBe(false);
        });

        it("not find impostor with poll stop", async () => {
            await expect(eventRepository.checkTargetImpostor(2, 2)).resolves.toBe(false);
        });
    });

    describe("method: findByGroupId", () => {
        it("find poll", async () => {
            await expect(eventRepository.findByGroupId(1)).resolves.toMatchObject({
                poll_id: "poll-1"
            } satisfies Partial<IEvent>);
        });

        it("not find poll", async () => {
            await expect(eventRepository.findByGroupId(-1)).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: create", () => {
        it("create event", async () => {
            await expect(
                eventRepository.create({
                    poll_id: "poll-test",
                    group_id: 1,
                    target_impostor: 1,
                    type: "impostor"
                })
            ).resolves.toMatchObject({
                poll_id: "poll-test"
            } satisfies Partial<IEvent>);
        });

        it("duplicate event with poll id", async () => {
            await expect(
                eventRepository.create({
                    poll_id: "poll-1",
                    group_id: 1,
                    target_impostor: 1,
                    type: "impostor"
                })
            ).rejects.toThrow();
        });
    });

    describe("method: listExpired", () => {
        it("find event", async () => {
            const list = await eventRepository.listExpired();

            expect(list.length).toBeGreaterThan(0);
            
            for (const event of list) {
                if(event.type === "out" || event.type === "out_x2"){
                    expect(event.expire).lessThanOrEqual(new Date());
                }else{
                    expect(event.expire_poll).lessThanOrEqual(new Date());
                }
            }
        });
    });

    describe("method: deleteByIds", () => {
        it("delete event", async () => {
            const [event1, event2] = await Promise.all([
                eventRepository.create({
                    poll_id: "poll-delete-1",
                    group_id: 1,
                    target_impostor: 1,
                    type: "impostor"
                }),
                eventRepository.create({
                    poll_id: "poll-delete-2",
                    group_id: 1,
                    target_impostor: 1,
                    type: "impostor"
                })
            ]);
            
            await expect(eventRepository.findById(event1._id)).resolves.toBeDefined();
            await expect(eventRepository.findById(event2._id)).resolves.toBeDefined();
            await expect(eventRepository.deleteByIds([event1._id, event2._id])).resolves.toBeUndefined();
            await expect(eventRepository.findById(event1._id)).rejects.toThrow(PollNotFound);
            await expect(eventRepository.findById(event2._id)).rejects.toThrow(PollNotFound);
        });

        it("all id of events not exists", async () => {
            await expect(eventRepository.deleteByIds([new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()])).rejects.toThrow(PollNotFound);
        });

        it("someone id of event not exists", async () => {
            const event = await eventRepository.create({
                poll_id: "poll-delete-3",
                group_id: 1,
                target_impostor: 1,
                type: "impostor"
            });
            
            await expect(eventRepository.findById(event._id)).resolves.toBeDefined();
            await expect(eventRepository.deleteByIds([event._id, new mongoose.Types.ObjectId()])).resolves.toBeUndefined();
            await expect(eventRepository.findById(event._id)).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: edit", () => {
        it("edit event", async () => {
            const event = await eventRepository.create({
                poll_id: "poll-edit-1",
                group_id: 1,
                target_impostor: 1,
                type: "impostor"
            });

            await expect(eventRepository.findById(event._id.toString())).resolves.toMatchObject({
                _id: event._id,
                poll_id: "poll-edit-1",
                type: "impostor"
            } satisfies Partial<IEvent>);

            await expect(eventRepository.edit(event._id, {type: "out"})).resolves.toMatchObject({
                _id: event._id,
                poll_id: "poll-edit-1",
                type: "out"
            } satisfies Partial<IEvent>);
        });

        it("cannot edit event already stopped", async () => {
            const event = await eventRepository.create({
                poll_id: "poll-edit-2",
                group_id: 1,
                target_impostor: 1,
                type: "impostor"
            });
            await eventRepository.edit(event._id, {stop: true});

            await expect(eventRepository.edit(event._id, {})).rejects.toThrow(PollNotFound);
        });

        it("not find event", async () => {
            await expect(eventRepository.edit(new mongoose.Types.ObjectId(), {})).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: answered", () => {
        it("add answer to event", async () => {
            const event = await eventRepository.create({
                poll_id: "poll-answer-1",
                group_id: 1,
                target_impostor: 1,
                type: "impostor"
            });

            await expect(eventRepository.answered(event.poll_id as string, 1)).resolves.toMatchObject({
                poll_id: "poll-answer-1",
                answered: [1]
            } satisfies Partial<IEvent>);

            await expect(eventRepository.answered(event.poll_id as string, 2)).resolves.toMatchObject({
                poll_id: "poll-answer-1",
                answered: [1, 2]
            } satisfies Partial<IEvent>);
        });

        it("add answer to event already stopped", async () => {
            const event = await eventRepository.create({
                poll_id: "poll-answer-2",
                group_id: 1,
                target_impostor: 1,
                type: "impostor"
            });
            await eventRepository.edit(event._id, {stop: true});

            await expect(eventRepository.answered(event._id.toString(), 1)).rejects.toThrow(PollNotFound);
        });
        
        it("not find event", async () => {
            await expect(eventRepository.answered(new mongoose.Types.ObjectId().toString(), 1)).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: deleteByGroupId", () => {
        it("find event", async () => {
            await eventRepository.create({
                poll_id: "poll-delete-1",
                group_id: 1234,
                target_impostor: 1,
                type: "impostor"
            });
            await eventRepository.create({
                poll_id: "poll-delete-2",
                group_id: 1234,
                target_impostor: 1,
                type: "impostor"
            });

            await expect(eventRepository.deleteByGroupId(1234)).resolves.toBeUndefined();
            await expect(eventRepository.findByGroupId(1234)).rejects.toThrow(PollNotFound);
        });
    });
});