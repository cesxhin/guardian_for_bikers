export interface ITrack {
    poll_id: string,
    group_id: number,
    user_id: number,
    positions: { lat: number, long: number, date: Date }[],
    totalKm: number,
    totalTime: number,
    terminate: boolean,
    updated: Date,
    created: Date,
}