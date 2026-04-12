import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import userData from "../../data/userData.ts";
import { IUser } from "../../../domains/interfaces/IUser.ts";
import { modelUser } from "../../../domains/models/userMode.ts";
import { UserNotFound } from "../../../utils/exceptionsUtils.ts";
import { UserRepository } from "../../../applications/repository/userRepository.ts";

describe("group-repository", () => {
    let instanceMongoServer: MongoMemoryServer | undefined;
    const userRepository = new UserRepository();

    beforeAll(async () => {
        instanceMongoServer = await MongoMemoryServer.create();

        await mongoose.connect(instanceMongoServer.getUri());

        //insert data
        await modelUser.insertMany(userData);
    });
    afterAll(async () => {
        await instanceMongoServer?.stop();
    });

    describe("method: findById", () => {
        it("find user", async () => {
            await expect(userRepository.findById(1, 1)).resolves.toMatchObject({
                id: 1,
                chat_id: 1
            } satisfies Partial<IUser>);
        });

        it("not find user", async () => {
            await expect(userRepository.findById(-1, -1)).rejects.toThrow(UserNotFound);
        });
    });

    describe("method: findByUsername", () => {
        it("find user", async () => {
            await expect(userRepository.findByUsername(1, "user")).resolves.toMatchObject({
                chat_id: 1,
                username: "user"
            } satisfies Partial<IUser>);
        });

        it("not find user", async () => {
            await expect(userRepository.findByUsername(1, "not_exist")).rejects.toThrow(UserNotFound);
        });
    });

    describe("method: findManyByGroupId", () => {
        it("find user", async () => {
            const list = await userRepository.findManyByGroupId(1);

            expect(list.length).toBeGreaterThan(0);

            for (const user of list) {
                expect(user.chat_id).toBe(1);
            }
        });

        it("not find user", async () => {
            await expect(userRepository.findManyByGroupId(-1)).resolves.toHaveLength(0);
        });
    });

    describe("method: edit", () => {
        it("edit user", async () => {
            await userRepository.create({
                chat_id: -111,
                currentYear: new Date().getFullYear(),
                id: 1,
                outWithBike: 0,
                points: 0,
                skipOutWithBike: 0,
                totalImpostor: 0,
                totalKm: 0,
                username: "user"
            });
            
            await expect(
                userRepository.edit(-111, 1, {
                    username: "edited"
                })
            ).resolves.toMatchObject({
                chat_id: -111,
                id: 1,
                username: "edited"
            } satisfies Partial<IUser>);
        });

        it("not find user", async () => {
            await expect(userRepository.edit(-1, -1, {})).rejects.toThrow(UserNotFound);
        });
    });

    describe("method: create", () => {
        it("create user", async () => {
            await expect(
                userRepository.create({
                    chat_id: -111222,
                    currentYear: new Date().getFullYear(),
                    id: 1,
                    outWithBike: 0,
                    points: 0,
                    skipOutWithBike: 0,
                    totalImpostor: 0,
                    totalKm: 0,
                    username: "user"
                })
            ).resolves.toMatchObject({
                chat_id: -111222,
                id: 1,
                username: "user"
            } satisfies Partial<IUser>);
        });

        it("duplicate user", async () => {
            await userRepository.create({
                chat_id: -123,
                currentYear: new Date().getFullYear(),
                id: 1,
                outWithBike: 0,
                points: 0,
                skipOutWithBike: 0,
                totalImpostor: 0,
                totalKm: 0,
                username: "user"
            });

            await expect(
                userRepository.create({
                    chat_id: -123,
                    currentYear: new Date().getFullYear(),
                    id: 1,
                    outWithBike: 0,
                    points: 0,
                    skipOutWithBike: 0,
                    totalImpostor: 0,
                    totalKm: 0,
                    username: "user"
                })
            ).rejects.toThrow();
        });
    });

    describe("method: deleteById", () => {
        it("find user", async () => {
            await userRepository.create({
                chat_id: -9999,
                currentYear: new Date().getFullYear(),
                id: 1,
                outWithBike: 0,
                points: 0,
                skipOutWithBike: 0,
                totalImpostor: 0,
                totalKm: 0,
                username: "user"
            });

            await expect(userRepository.deleteById(-9999, 1)).resolves.toBeUndefined();
        });

        it("not find user", async () => {
            await expect(userRepository.deleteById(-1, -1)).rejects.toThrow(UserNotFound);
        });
    });

    describe("method: deleteManyByChatId", () => {
        it("delete many user", async () => {
            await Promise.all([
                userRepository.create({
                    chat_id: -777,
                    currentYear: new Date().getFullYear(),
                    id: 1,
                    outWithBike: 0,
                    points: 0,
                    skipOutWithBike: 0,
                    totalImpostor: 0,
                    totalKm: 0,
                    username: "user"
                }),
                userRepository.create({
                    chat_id: -777,
                    currentYear: new Date().getFullYear(),
                    id: 2,
                    outWithBike: 0,
                    points: 0,
                    skipOutWithBike: 0,
                    totalImpostor: 0,
                    totalKm: 0,
                    username: "user"
                }),
                userRepository.create({
                    chat_id: -888,
                    currentYear: new Date().getFullYear(),
                    id: 2,
                    outWithBike: 0,
                    points: 0,
                    skipOutWithBike: 0,
                    totalImpostor: 0,
                    totalKm: 0,
                    username: "user"
                })
            ]);

            await expect(userRepository.findManyByGroupId(-777)).resolves.toHaveLength(2);
            await expect(userRepository.deleteManyByChatId(-777)).resolves.toBeUndefined();
            await expect(userRepository.findManyByGroupId(-777)).resolves.toHaveLength(0);
            await expect(userRepository.findManyByGroupId(-888)).resolves.toHaveLength(1);
        });
    });

    describe("method: findMissingFromList", () => {
        it("find other users", async () => {
            const whiteList: number[] = [1];

            const list = await userRepository.findMissingFromList(1, whiteList);

            expect(list.length).toBeGreaterThan(0);

            for (const user of list) {
                expect(whiteList).not.toContain(user.id);
            }
        });
    });

    //skip function resetAll
});