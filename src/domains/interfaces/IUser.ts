export interface IUser {
    id: number,
    chat_id: number,
    username: string,
    outWithBike: number,
    skipOutWithBike: number,
    currentYear: number,
    created: Date,
    updated: Date | null,
    points: number
}