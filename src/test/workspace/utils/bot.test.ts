import { describe, expect, it, vi } from "vitest";

import { checkMyCommand, commands, createMention, onlyPermissionGroup } from "../../../utils/botUtils.ts";

vi.mock(import("../../../env.ts"), () => {
    return {
        USERNAME_BOT: "bot",
        USERS_EXPIRE_SECONDS: 10800
    }
});

describe("bot-utils", () => {
    
    describe("method: onlyPermissionGroup", () => {
        it('valid permission only group', () => {
            expect(onlyPermissionGroup({ chat: { id: 1, type: "group" } })).eq(true);

            expect(onlyPermissionGroup({ chat: { id: 1, type: "supergroup" } })).eq(true);
        });

        it('invalid permission other type', () => {
            expect(onlyPermissionGroup({ chat: { id: 1, type: "channel" } })).eq(false);

            expect(onlyPermissionGroup({ chat: { id: 1, type: "private" } })).eq(false);
        });
    })
    
    describe("method: checkMyCommand", () => {
        it('valid command', () => {
            expect(checkMyCommand("/about", commands.ABOUT)).eq(true);

            expect(checkMyCommand("/impostor@bot", commands.IMPOSTOR)).eq(true);
        });
        
        it('invalid command', () => {
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
        it('valid command', () => {
            expect(createMention({first_name: "name", user_id: 1}, "hello")).eq("[name](tg://user?id=1) hello");
        });
    });
})