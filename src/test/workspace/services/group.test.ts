import z from "zod";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import groupsData from "../../data/groupsData.ts";
import { GroupConflict } from "../../../utils/exceptionsUtils.ts";
import { modelGroup } from "../../../domains/models/groupModel.ts";
import { schemaGroup } from "../../../domains/interfaces/IGroup.ts";
import { GroupService } from "../../../applications/services/groupService.ts";

describe("group-service", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const groupService = new GroupService();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelGroup.insertMany(groupsData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: create", () => {
        it("create group", async () => {
            const groupCreate = await groupService.create(-1, "service-create-group");

            await expect(z.parseAsync(schemaGroup, groupCreate)).resolves.toBeDefined();
            expect(groupCreate.updated).toBeNull();
        });

        it("already exist group", async () => {
            await expect(groupService.create(1, "test-1")).rejects.toThrow(GroupConflict);
        });
    });

    describe("method: edit", () => {
        it("edit group", async () => {
            const group = await groupService.create(-2, "service-create-group-2");

            const groupEdited = await groupService.edit(-2, {
                name: "edited"
            });

            await expect(z.parseAsync(schemaGroup, groupEdited)).resolves.toBeDefined();

            //check field update
            expect(groupEdited.updated).not.toBeNull();
            expect(groupEdited.updated?.getTime()).not.eq(group.updated?.getTime());
            expect(groupEdited.updated?.getTime()).not.eq(groupEdited.created?.getTime());
        });
    });

    describe("method: delete", () => {
        it("delete group", async () => {
            await groupService.create(-3, "service-create-group-3");

            await expect(groupService.delete(-3)).resolves.toBeUndefined();
        });
    });

    describe("method: find", () => {
        it("find group", async () => {
            const group = await groupService.find(1);

            await expect(z.parseAsync(schemaGroup, group)).resolves.toBeDefined();
        });
    });

    describe("method: listActive", () => {
        it("list groups", async () => {
            const groups = await groupService.listActive();

            expect(groups.length).toBeGreaterThan(0);

            for (const group of groups) {
                await expect(z.parseAsync(schemaGroup, group)).resolves.toBeDefined();
            }
        });
    });

    describe("method: findAll", () => {
        it("list all groups", async () => {
            const groups = await groupService.findAll();

            expect(groups.length).toBeGreaterThan(0);

            for (const group of groups) {
                await expect(z.parseAsync(schemaGroup, group)).resolves.toBeDefined();
            }
        });
    });
});