export interface IGroup {
    id: number,
    name: string,
    enabled: boolean,
    latitude: number,
    longitude: number,
    location: string,
    timezone: string,
    time_trigger: string,
    monday: boolean,
    tuesday: boolean,
    wednesday: boolean,
    thursday: boolean,
    friday: boolean,
    saturday: boolean,
    sunday: boolean
}