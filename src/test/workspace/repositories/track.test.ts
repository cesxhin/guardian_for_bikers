import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import trackData from "../../data/trackData.ts";
import { ITrack } from "../../../domains/interfaces/ITrack.ts";
import { TrackNotFound } from "../../../utils/exceptionsUtils.ts";
import { modelTrack } from "../../../domains/models/trackModel.ts";
import { TrackRepository } from "../../../applications/repository/trackRepository.ts";

describe("track-repository", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const trackRepository = new TrackRepository();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelTrack.insertMany(trackData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: findByIds", () => {
        it("find track", async () => {
            await expect(trackRepository.findByIds(1, 1, "poll-1")).resolves.toMatchObject({
                group_id: 1,
                poll_id: "poll-1",
                user_id: 1
            } satisfies Partial<ITrack>);
        });

        it("not find track with not exist user id", async () => {
            await expect(trackRepository.findByIds(-1, 1, "poll-1")).rejects.toThrow(TrackNotFound);
        });

        it("not find track with not exist group id", async () => {
            await expect(trackRepository.findByIds(1, -1, "poll-1")).rejects.toThrow(TrackNotFound);
        });

        it("not find track with not exist poll id", async () => {
            await expect(trackRepository.findByIds(1, 1, "not_exist")).rejects.toThrow(TrackNotFound);
        });
    });

    describe("method: edit", () => {
        it("edit track", async () => {
            await trackRepository.addPositions({
                group_id: 2,
                poll_id: "poll-edit-1",
                user_id: 2,
                positions: []
            });

            await expect(
                trackRepository.edit(2, 2, "poll-edit-1", {totalKm: 10})
            ).resolves.toMatchObject({
                group_id: 2,
                poll_id: "poll-edit-1",
                user_id: 2,
                totalKm: 10
            } satisfies Partial<ITrack>);
        });

        it("cannot edit track already terminate", async () => {
            await trackRepository.addPositions({
                group_id: 2,
                poll_id: "poll-edit-2",
                user_id: 2,
                positions: []
            });
            await trackRepository.edit(2, 2, "poll-edit-2", {terminate: true});

            await expect(trackRepository.edit(2, 2, "poll-edit-2", {})).rejects.toThrow(TrackNotFound);
        });

        it("not found track", async () => {
            await expect(trackRepository.edit(-1, -1, "not_exist", {})).rejects.toThrow(TrackNotFound);
        });
    });

    describe("method: findByPollId", () => {
        it("find tracks", async () => {
            const list = await trackRepository.findByPollId("poll-1");

            expect(list.length).toBeGreaterThan(0);

            for (const track of list) {
                expect(track.terminate).toBe(false);
            }
        });

        it("not found tracks", async () => {
            await expect(trackRepository.findByPollId("poll-remove-pos-1")).resolves.toHaveLength(0);
        });
    });

    describe("method: addPositions", () => {
        it("find track", async () => {
            await trackRepository.addPositions({
                group_id: 2,
                poll_id: "poll-add-pos-1",
                user_id: 2,
                positions: []
            });

            const data: Pick<ITrack, "positions"> = {positions: [{date: new Date(), lat: 0, long: 0}, {date: new Date(), lat: 5, long: 1}]};
            
            await expect(
                trackRepository.addPositions({
                    group_id: 2,
                    user_id: 2,
                    poll_id: "poll-add-pos-1",
                    ...data
                })
            ).resolves.toMatchObject({
                group_id: 2,
                user_id: 2,
                poll_id: "poll-add-pos-1",
                positions: data.positions
            } satisfies Partial<ITrack>);
        });

        it("not found track", async () => {
            await expect(trackRepository.findByPollId("poll-remove-pos-1")).resolves.toHaveLength(0);
        });

        it("not found track already terminate", async () => {
            await trackRepository.addPositions({
                group_id: 2,
                poll_id: "poll-add-pos-2",
                user_id: 2,
                positions: []
            });

            await expect(trackRepository.findByIds(2, 2, "poll-add-pos-2")).resolves.toBeDefined();
            await trackRepository.edit(2, 2, "poll-add-pos-2", {terminate: true});
            await expect(trackRepository.findByPollId("poll-add-pos-2")).resolves.toHaveLength(0);
        });
    });

    describe("method: deleteByIds", () => {
        it("find track", async () => {
            await trackRepository.addPositions({
                group_id: 2,
                poll_id: "poll-delete-1",
                user_id: 2,
                positions: []
            });
            
            await expect(trackRepository.findByIds(2, 2, "poll-delete-1")).resolves.toBeDefined();
            await expect(trackRepository.deleteByIds(2, 2, "poll-delete-1")).resolves.toBeUndefined();
            await expect(trackRepository.findByIds(2, 2, "poll-delete-1")).rejects.toThrow(TrackNotFound);
        });

        it("not found track", async () => {
            await expect(trackRepository.deleteByIds(-1, -1, "not_exist")).rejects.toThrow(TrackNotFound);
        });
    });

    describe("method: deleteByGroupId", () => {
        it("find tracks", async () => {
            await Promise.all([
                trackRepository.addPositions({
                    group_id: 3,
                    poll_id: "poll-delete-many-1",
                    user_id: 1,
                    positions: []
                }),
                trackRepository.addPositions({
                    group_id: 3,
                    poll_id: "poll-delete-many-2",
                    user_id: 2,
                    positions: []
                }),
                trackRepository.addPositions({
                    group_id: 3,
                    poll_id: "poll-delete-many-3",
                    user_id: 3,
                    positions: []
                })
            ]);

            await expect(trackRepository.findByIds(1, 3, "poll-delete-many-1")).resolves.toBeDefined();
            await expect(trackRepository.findByIds(2, 3, "poll-delete-many-2")).resolves.toBeDefined();
            await expect(trackRepository.findByIds(3, 3, "poll-delete-many-3")).resolves.toBeDefined();

            await expect(trackRepository.deleteByGroupId(3)).resolves.toBeUndefined();

            await expect(trackRepository.findByIds(1, 3, "poll-delete-many-1")).rejects.toThrow(TrackNotFound);
            await expect(trackRepository.findByIds(2, 3, "poll-delete-many-2")).rejects.toThrow(TrackNotFound);
            await expect(trackRepository.findByIds(3, 3, "poll-delete-many-3")).rejects.toThrow(TrackNotFound);
        });
    });
});