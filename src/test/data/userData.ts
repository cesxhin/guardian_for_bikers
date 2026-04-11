import { IUser } from "../../domains/interfaces/IUser.ts";

export default [
    {
        chat_id: 1,
        created: new Date(),
        currentYear: new Date().getFullYear(),
        id: 1,
        outWithBike: 0,
        points: 0,
        scoreMultiplier: 0,
        skipOutWithBike: 0,
        totalImpostor: 0,
        totalKm: 0,
        updated: new Date(),
        username: "user"
    },
    {
        chat_id: 1,
        created: new Date(),
        currentYear: new Date().getFullYear(),
        id: 2,
        outWithBike: 0,
        points: 0,
        scoreMultiplier: 0,
        skipOutWithBike: 0,
        totalImpostor: 0,
        totalKm: 0,
        updated: new Date(),
        username: "user-2"
    },
    {
        chat_id: 1,
        created: new Date(),
        currentYear: new Date().getFullYear(),
        id: 3,
        outWithBike: 0,
        points: 0,
        scoreMultiplier: 0,
        skipOutWithBike: 0,
        totalImpostor: 0,
        totalKm: 0,
        updated: new Date(),
        username: "user-3"
    }
] satisfies IUser[];