export interface IPoll {
    id: string,
    message_id: number,
    group_id: number,
    type: "out" | "out_x2" | "question",
    expire: Date,
    answered: string[],
    stop: boolean
}