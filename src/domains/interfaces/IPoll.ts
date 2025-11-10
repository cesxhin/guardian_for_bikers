export interface IPoll {
    id: string,
    message_id: number,
    group_id: number,
    type: "out" | "out_x2" | "question" | "impostor",
    expire: Date,
    answered: number[],
    stop: boolean,
    created: Date,
    updated: Date,
    target_impostor: number
}