export interface IGroup {
    id: number,
    name: string,
    enabled: boolean,
    latitude: number,
    longitude: number,
    location: string,
    timezone: string,
    start_time_guardian: string,
    end_time_guardian: string,
    days_trigger: [boolean, boolean, boolean, boolean, boolean, boolean, boolean],
    created: Date,
    updated: Date | null
}