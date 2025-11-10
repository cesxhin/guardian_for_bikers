import _ from "lodash";
import { LocationRepository } from "../repository/weatherLocationRepository";
import { IWeatherLocation } from "../domains/interfaces/api/IWeatherLocation";

export class LocationSerivce {
    private locationRepository = new LocationRepository();

    async exist(location: string): Promise<IWeatherLocation | null> {
        location = location.toLowerCase().trim();
        const locations = await this.locationRepository.findMany(location);

        return _.find(locations.results, (currentLocation) => currentLocation.name.toLowerCase() === location);
    }
}