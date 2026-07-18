import z from "zod";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import trackData from "../../data/trackData.ts";
import { schemaTrack } from "../../../domains/interfaces/ITrack.ts";
import { modelTrack } from "../../../domains/models/trackModel.ts";
import { TrackService } from "../../../applications/services/trackService.ts";

describe("track-service", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const trackService = new TrackService();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelTrack.insertMany(trackData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: addPositions", () => {
        it("add track", async () => {
            const track = await trackService.addPositions({
                group_id: -1,
                event_id: "poll-position",
                positions: [],
                user_id: -1
            });
            
            await expect(z.parseAsync(schemaTrack, track)).resolves.toBeDefined();
            expect(track.updated).not.toBeNull();
        });
    });

    describe("method: findByEventId", () => {
        it("find tracks", async () => {
            const tracks = await trackService.findByEventId("poll-1");
            
            expect(tracks.length).toBeGreaterThan(0);

            for (const track of tracks) {
                await expect(z.parseAsync(schemaTrack, track)).resolves.toBeDefined();
            }
        });
    });

    describe("method: deleteByIds", () => {
        it("delete track", async () => {
            await trackService.addPositions({
                group_id: -1,
                event_id: "poll-delete",
                positions: [],
                user_id: -1
            });

            await expect(trackService.deleteByIds(-1, -1, "poll-delete")).resolves.toBeUndefined();
        });
    });

    describe("method: deleteByGroupId", () => {
        it("delete track", async () => {
            await trackService.addPositions({
                group_id: -3,
                event_id: "poll-delete",
                positions: [],
                user_id: -1
            });

            await expect(trackService.deleteByGroupId(-3)).resolves.toBeUndefined();
        });
    });

    describe("method: edit", () => {
        it("edit track", async () => {
            const track = await trackService.addPositions({
                group_id: -2,
                event_id: "poll-position-2",
                positions: [],
                user_id: -2
            });

            await new Promise((resolve) => setTimeout(resolve, 25));

            const trackEdited = await trackService.edit(-2, -2, "poll-position-2", {totalKm: 10});
            
            await expect(z.parseAsync(schemaTrack, trackEdited)).resolves.toBeDefined();

            
            //check field update
            expect(trackEdited.updated).not.toBeNull();
            expect(trackEdited.updated?.getTime()).not.eq(track.updated?.getTime());
            expect(trackEdited.updated?.getTime()).not.eq(trackEdited.created?.getTime());
        });
    });
});