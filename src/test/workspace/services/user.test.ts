import z from "zod";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import userData from "../../data/userData.ts";
import userCacheUtils from "../../../utils/userCacheUtils.ts";
import { modelUser } from "../../../domains/models/userMode.ts";
import { UserConflict } from "../../../utils/exceptionsUtils.ts";
import { schemaUser } from "../../../domains/interfaces/IUser.ts";
import { UserService } from "../../../applications/services/userService.ts";

describe("user-service", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const userService = new UserService();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelUser.insertMany(userData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: create", () => {
        it("create user", async () => {
            const user = await userService.create(-1, -1, "user-service");

            await expect(z.parseAsync(schemaUser, user)).resolves.toBeDefined();

            //check cache
            expect(userCacheUtils.userCache.get(userCacheUtils.getPrimaryKeyCompose(user.chat_id, user.id))).toEqual(user);

            //check field update
            expect(user.updated).toBeNull();
        });

        it("conflict user", async () => {
            await expect(userService.create(1, 1, "user")).rejects.toThrow(UserConflict);
        });
    });

    describe("method: edit", () => {
        it("edit user", async () => {
            const user = await userService.create(-2, -2, "user-service-2");
            const userEdited = await userService.edit(-2, -2, {username: "edited"});

            await expect(z.parseAsync(schemaUser, userEdited)).resolves.toBeDefined();

            //check cache
            expect(userCacheUtils.userCache.get(userCacheUtils.getPrimaryKeyCompose(user.chat_id, user.id))).toEqual(userEdited);

            //check field update
            expect(userEdited.updated).not.toBeNull();
        });

        it("conflict user", async () => {
            await expect(userService.create(1, 1, "user")).rejects.toThrow(UserConflict);
        });
    });

    describe("method: findById", () => {
        it("find user", async () => {
            const user = await userService.findById(1, 1);

            await expect(z.parseAsync(schemaUser, user)).resolves.toBeDefined();
        });
    });

    describe("method: findByUsername", () => {
        it("find user", async () => {
            const user = await userService.findByUsername(1, "user");

            await expect(z.parseAsync(schemaUser, user)).resolves.toBeDefined();
        });
    });

    describe("method: findManyByGroupId", () => {
        it("find user", async () => {
            const users = await userService.findManyByGroupId(1);

            expect(users.length).toBeGreaterThan(0);

            for (const user of users) {
                await expect(z.parseAsync(schemaUser, user)).resolves.toBeDefined();
            }
        });
    });

    describe("method: deleteById", () => {
        it("delete user", async () => {
            const user = await userService.create(-3, -3, "user-service-delete");
            
            expect(userCacheUtils.userCache.get(userCacheUtils.getPrimaryKeyCompose(user.chat_id, user.id))).toBeDefined();
            await expect(userService.deleteById(-3, -3)).resolves.toBeUndefined();
            expect(userCacheUtils.userCache.get(userCacheUtils.getPrimaryKeyCompose(user.chat_id, user.id))).toBeUndefined();
        });
    });

    describe("method: deleteManyByChatId", () => {
        it("delete many users", async () => {
            const usersCreated = await Promise.all([
                userService.create(-4, -1, "user-service-delete-many-1"),
                userService.create(-4, -2, "user-service-delete-many-2"),
                userService.create(-4, -3, "user-service-delete-many-3")
            ]);

            for (const user of usersCreated) {
                expect(userCacheUtils.userCache.get(userCacheUtils.getPrimaryKeyCompose(user.chat_id, user.id))).toBeDefined();
            }
            
            await expect(userService.deleteManyByChatId(-4)).resolves.toBeUndefined();

            for (const user of usersCreated) {
                expect(userCacheUtils.userCache.get(userCacheUtils.getPrimaryKeyCompose(user.chat_id, user.id))).toBeUndefined();
            }
        });
    });

    describe("method: getIdsByChatId", () => {
        it("get ids of users", async () => {
            await expect(userService.getIdsByChatId(1)).resolves.toBeDefined();
        });
    });

    describe("method: resetScoreMultiplerNotAnswered", () => {
        it("reset score multipler", async () => {
            let [user, user2] = await Promise.all([
                userService.create(-4, -1, "user-service-score-1"),
                userService.create(-4, -2, "user-service-score-2")
            ]);

            [user, user2] = await Promise.all([
                userService.edit(user.chat_id, user.id, {consecutive: 10}),
                userService.edit(user2.chat_id, user2.id, {consecutive: 10})
            ]);

            expect(user.consecutive).toBe(10);
            expect(user2.consecutive).toBe(10);

            await expect(userService.resetScoreMultiplerNotAnswered(user.chat_id, [user2.id])).resolves.toBeUndefined();

            user = await userService.findById(user.chat_id, user.id);
            user2 = await userService.findById(user2.chat_id, user2.id);

            expect(user.consecutive).toBe(0);
            expect(user2.consecutive).toBe(10);
        });
    });

    //skip resetAll
});