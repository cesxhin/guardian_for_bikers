export interface IGroup {
    id: number,
    name: string,
    enabled: boolean,
    latitude: number,
    longitude: number,
    location: string,
    timezone: string,
    time_trigger: string,
    days_trigger: [boolean, boolean, boolean, boolean, boolean, boolean, boolean]
}