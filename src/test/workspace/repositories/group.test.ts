import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import groupsData from "../../data/groupsData.ts";
import { IGroup } from "../../../domains/interfaces/IGroup.ts";
import { GroupNotFound } from "../../../utils/exceptionsUtils.ts";
import { modelGroup } from "../../../domains/models/groupModel.ts";
import {GroupRepository} from "../../../repository/groupRepository.ts";

describe("group-repository", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const groupRepository = new GroupRepository();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelGroup.insertMany(groupsData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: find", () => {
        it("find group", async () => {
            await expect(groupRepository.find(1)).resolves.toMatchObject({
                id: 1
            } satisfies Partial<IGroup>);
        });

        it("not find group", async () => {
            await expect(groupRepository.find(-1)).rejects.toThrow(GroupNotFound);
        });
    });

    describe("method: findAll", () => {
        it("find groups", async () => {
            await expect(groupRepository.findAll()).resolves.toBeInstanceOf(Array);
        });
    });

    describe("method: edit", () => {
        it("find group", async () => {
            await groupRepository.create({
                id: -111,
                name: "test-edit-1",
                latitude: 0,
                longitude: 0,
                location: "italy",
                timezone: "rome",
                days_trigger: [true, true, true, true, true, true, true],
                enabled: true,
                start_time_guardian: "10:00",
                end_time_guardian: "12:00"
            });

            
            await expect(groupRepository.find(-111)).resolves.toMatchObject({
                id: -111,
                name: "test-edit-1"
            } satisfies Partial<IGroup>);
            
            await expect(groupRepository.edit(-111, {name: "edited"})).resolves.toMatchObject({
                id: -111,
                name: "edited"
            } satisfies Partial<IGroup>);
        });

        it("not find group", async () => {
            await expect(groupRepository.edit(-1, {name: "edited"})).rejects.toThrow(GroupNotFound);
        });
    });

    describe("method: create", () => {
        it("create group", async () => {
            await expect(
                groupRepository.create({
                    id: -99999,
                    name: "test--99999",
                    latitude: 0,
                    longitude: 0,
                    location: "italy",
                    timezone: "rome",
                    days_trigger: [true, true, true, true, true, true, true],
                    enabled: true,
                    start_time_guardian: "10:00",
                    end_time_guardian: "12:00"
                })
            ).resolves.toMatchObject({
                id: -99999
            } satisfies Partial<IGroup>);
        });

        it("duplicate group with id", async () => {
            await expect(
                groupRepository.create({
                    id: 1,
                    name: "test-1",
                    latitude: 0,
                    longitude: 0,
                    location: "italy",
                    timezone: "rome",
                    days_trigger: [true, true, true, true, true, true, true],
                    enabled: true,
                    start_time_guardian: "10:00",
                    end_time_guardian: "12:00"
                })
            ).rejects.toThrow();
        });
    });

    describe("method: delete", () => {
        it("find group", async () => {
            await groupRepository.create({
                id: -111111,
                name: "test--111111",
                latitude: 0,
                longitude: 0,
                location: "italy",
                timezone: "rome",
                days_trigger: [true, true, true, true, true, true, true],
                enabled: true,
                start_time_guardian: "10:00",
                end_time_guardian: "12:00"
            });

            await expect(groupRepository.find(-111111)).resolves.toBeDefined();
            await expect(groupRepository.delete(-111111)).resolves.toBeUndefined();
            await expect(groupRepository.find(-111111)).rejects.toThrow(GroupNotFound);
        });

        it("not find group", async () => {
            await expect(groupRepository.delete(-1)).rejects.toThrow(GroupNotFound);
        });
    });

    describe("method: listActive", () => {
        it("list groups active", async () => {
            const list = await groupRepository.listActive();

            expect(list.length).toBeGreaterThan(0);

            for (const group of list) {
                expect(group.enabled).toBe(true);
            }
        });
    });
});