import { describe, expect, it, vi } from "vitest";

import { calculateScoreMultiplier, checkMyCommand, commands, createMention, onlyPermissionGroup } from "../../../utils/botUtils.ts";

vi.mock(import("../../../env.ts"), () => {
    return {
        POLLS_CACHE_EXPIRE: 3900,
        POLLS_CACHE_CHECK_PERIOD: 300,
        USERNAME_BOT: "bot",
        USERS_EXPIRE_SECONDS: 10800
    };
});

describe("bot-utils", () => {
    
    describe("method: onlyPermissionGroup", () => {
        it("valid permission only group", () => {
            expect(onlyPermissionGroup({ chat: { id: 1, type: "group" } })).eq(true);

            expect(onlyPermissionGroup({ chat: { id: 1, type: "supergroup" } })).eq(true);
        });

        it("invalid permission other type", () => {
            expect(onlyPermissionGroup({ chat: { id: 1, type: "channel" } })).eq(false);

            expect(onlyPermissionGroup({ chat: { id: 1, type: "private" } })).eq(false);
        });
    });
    
    describe("method: checkMyCommand", () => {
        it("valid command", () => {
            expect(checkMyCommand("/about", commands.ABOUT)).eq(true);

            expect(checkMyCommand("/impostor@bot", commands.IMPOSTOR)).eq(true);
        });
        
        it("invalid command", () => {
            expect(checkMyCommand("about", commands.ABOUT)).eq(false);

            expect(checkMyCommand("/impostor@ bot", commands.IMPOSTOR)).eq(false);

            expect(checkMyCommand("/ impostor@bot", commands.IMPOSTOR)).eq(false);

            expect(checkMyCommand("something here /impostor@bot", commands.IMPOSTOR)).eq(false);

            expect(checkMyCommand("/impostor@invalidBot", commands.IMPOSTOR)).eq(false);
            
            expect(checkMyCommand(null, commands.IMPOSTOR)).eq(false);

            expect(checkMyCommand(undefined, commands.IMPOSTOR)).eq(false);
        });
    });
    
    describe("method: createMention", () => {
        it("valid command", () => {
            expect(createMention({first_name: "name", user_id: 1}, "hello")).eq("[name](tg://user?id=1) hello");
        });
    });
    
    describe("method: calculateScoreMultiplier", () => {
        it("check valid range", () => {
            expect(calculateScoreMultiplier(0)).eq(1);
            expect(calculateScoreMultiplier(1)).eq(1);
            expect(calculateScoreMultiplier(2)).eq(2);
            expect(calculateScoreMultiplier(3)).eq(2);
            expect(calculateScoreMultiplier(4)).eq(2);
            expect(calculateScoreMultiplier(5)).eq(3);
            expect(calculateScoreMultiplier(6)).eq(3);
            expect(calculateScoreMultiplier(7)).eq(3);
            expect(calculateScoreMultiplier(8)).eq(4);
            expect(calculateScoreMultiplier(9)).eq(4);
            expect(calculateScoreMultiplier(10)).eq(4);
            expect(calculateScoreMultiplier(11)).eq(4);
            expect(calculateScoreMultiplier(12)).eq(4);
            expect(calculateScoreMultiplier(13)).eq(4);
            expect(calculateScoreMultiplier(14)).eq(5);
            expect(calculateScoreMultiplier(15)).eq(5);
            expect(calculateScoreMultiplier(16)).eq(5);
        });
    });
});