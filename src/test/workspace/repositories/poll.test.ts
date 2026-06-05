import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import pollData from "../../data/pollData.ts";
import { IPoll } from "../../../domains/interfaces/IPoll.ts";
import { modelPoll } from "../../../domains/models/pollModel.ts";
import { PollNotFound } from "../../../utils/exceptionsUtils.ts";
import { PollRepository } from "../../../applications/repository/pollRepository.ts";

describe("poll-repository", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const pollRepository = new PollRepository();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelPoll.insertMany(pollData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: findById", () => {
        it("find poll", async () => {
            await expect(pollRepository.findById("poll-1")).resolves.toMatchObject({
                id: "poll-1"
            } satisfies Partial<IPoll>);
        });

        it("not find poll", async () => {
            await expect(pollRepository.findById("not_exist")).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: checkTargetImpostor", () => {
        it("find impostor", async () => {
            await expect(pollRepository.checkTargetImpostor(1, 1)).resolves.toBe(true);
        });

        it("not find impostor with not exist group", async () => {
            await expect(pollRepository.checkTargetImpostor(-1, 1)).resolves.toBe(false);
        });

        it("not find impostor with not exist user", async () => {
            await expect(pollRepository.checkTargetImpostor(1, -1)).resolves.toBe(false);
        });

        it("not find impostor with poll stop", async () => {
            await expect(pollRepository.checkTargetImpostor(2, 2)).resolves.toBe(false);
        });
    });

    describe("method: findByGroupId", () => {
        it("find poll", async () => {
            await expect(pollRepository.findByGroupId(1)).resolves.toMatchObject({
                id: "poll-6"
            } satisfies Partial<IPoll>);
        });

        it("not find poll", async () => {
            await expect(pollRepository.findByGroupId(-1)).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: create", () => {
        it("create poll", async () => {
            await expect(
                pollRepository.create({
                    id: "poll-test",
                    group_id: 1,
                    message_id: 1,
                    target_impostor: 1,
                    type: "impostor"
                })
            ).resolves.toMatchObject({
                id: "poll-test"
            } satisfies Partial<IPoll>);
        });

        it("duplicate poll with id", async () => {
            await expect(
                pollRepository.create({
                    id: "poll-1",
                    group_id: 1,
                    message_id: 1,
                    target_impostor: 1,
                    type: "impostor"
                })
            ).rejects.toThrow();
        });
    });

    describe("method: listExpired", () => {
        it("find poll", async () => {
            const list = await pollRepository.listExpired();

            expect(list.length).toBeGreaterThan(0);
            
            for (const group of list) {
                expect(group.expire).lessThanOrEqual(new Date());
            }
        });
    });

    describe("method: deleteByIds", () => {
        it("delete poll", async () => {
            await Promise.all([
                pollRepository.create({
                    id: "poll-delete-1",
                    group_id: 1,
                    message_id: 1,
                    target_impostor: 1,
                    type: "impostor"
                }),
                pollRepository.create({
                    id: "poll-delete-2",
                    group_id: 1,
                    message_id: 1,
                    target_impostor: 1,
                    type: "impostor"
                })
            ]);
            
            await expect(pollRepository.findById("poll-delete-1")).resolves.toBeDefined();
            await expect(pollRepository.findById("poll-delete-2")).resolves.toBeDefined();
            await expect(pollRepository.deleteByIds(["poll-delete-1", "poll-delete-2"])).resolves.toBeUndefined();
            await expect(pollRepository.findById("poll-delete-1")).rejects.toThrow(PollNotFound);
            await expect(pollRepository.findById("poll-delete-2")).rejects.toThrow(PollNotFound);
        });

        it("all id of poll not exists", async () => {
            await expect(pollRepository.deleteByIds(["not_exist", "not_exist_2"])).rejects.toThrow(PollNotFound);
        });

        it("someone id of poll not exists", async () => {
            await pollRepository.create({
                id: "poll-delete-3",
                group_id: 1,
                message_id: 1,
                target_impostor: 1,
                type: "impostor"
            });
            
            await expect(pollRepository.findById("poll-delete-3")).resolves.toBeDefined();
            await expect(pollRepository.deleteByIds(["poll-delete-3", "not_exist_2"])).resolves.toBeUndefined();
            await expect(pollRepository.findById("poll-delete-3")).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: edit", () => {
        it("edit poll", async () => {
            await pollRepository.create({
                id: "poll-edit-1",
                group_id: 1,
                message_id: 1,
                target_impostor: 1,
                type: "impostor"
            });

            await expect(pollRepository.findById("poll-edit-1")).resolves.toMatchObject({
                id: "poll-edit-1",
                type: "impostor"
            } satisfies Partial<IPoll>);

            await expect(pollRepository.edit("poll-edit-1", {type: "out"})).resolves.toMatchObject({
                id: "poll-edit-1",
                type: "out"
            } satisfies Partial<IPoll>);
        });

        it("cannot edit poll already stopped", async () => {
            await pollRepository.create({
                id: "poll-edit-2",
                group_id: 1,
                message_id: 1,
                target_impostor: 1,
                type: "impostor"
            });
            await pollRepository.edit("poll-edit-2", {stop: true});

            await expect(pollRepository.edit("poll-edit-2", {})).rejects.toThrow(PollNotFound);
        });

        it("not find poll", async () => {
            await expect(pollRepository.edit("not_exist", {})).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: answered", () => {
        it("add answer to poll", async () => {
            await pollRepository.create({
                id: "poll-answer-1",
                group_id: 1,
                message_id: 1,
                target_impostor: 1,
                type: "impostor"
            });

            await expect(pollRepository.answered("poll-answer-1", 1)).resolves.toMatchObject({
                id: "poll-answer-1",
                answered: [1]
            } satisfies Partial<IPoll>);

            await expect(pollRepository.answered("poll-answer-1", 2)).resolves.toMatchObject({
                id: "poll-answer-1",
                answered: [1, 2]
            } satisfies Partial<IPoll>);
        });

        it("add answer to poll already stopped", async () => {
            await pollRepository.create({
                id: "poll-answer-2",
                group_id: 1,
                message_id: 1,
                target_impostor: 1,
                type: "impostor"
            });
            await pollRepository.edit("poll-answer-2", {stop: true});

            await expect(pollRepository.answered("poll-answer-2", 1)).rejects.toThrow(PollNotFound);
        });
        
        it("not find poll", async () => {
            await expect(pollRepository.answered("not_exist", 1)).rejects.toThrow(PollNotFound);
        });
    });

    describe("method: deleteByGroupId", () => {
        it("find poll", async () => {
            await pollRepository.create({
                id: "poll-delete-1",
                group_id: 1234,
                message_id: 1,
                target_impostor: 1,
                type: "impostor"
            });
            await pollRepository.create({
                id: "poll-delete-2",
                group_id: 1234,
                message_id: 1,
                target_impostor: 1,
                type: "impostor"
            });

            await expect(pollRepository.deleteByGroupId(1234)).resolves.toBeUndefined();
            await expect(pollRepository.findByGroupId(1234)).rejects.toThrow(PollNotFound);
        });
    });
});