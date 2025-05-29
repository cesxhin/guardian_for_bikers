import _ from "lodash";
import { LocationRepository } from "../repository/locationRepository";
import { ILocation } from "../domains/interfaces/ILocation";

export class LocationSerivce {
    private locationRepository = new LocationRepository();

    async exist(location: string): Promise<ILocation | null> {
        location = location.toLowerCase().trim();
        const locations = await this.locationRepository.findMany(location);

        return _.find(locations.results, { name: location });
    }
}