import { LocationRepository } from "../repository/locationRepository";

export class LocationSerivce {
    private locationRepository = new LocationRepository();

    async exist(location: string): Promise<boolean> {
        location = location.toLowerCase().trim();
        const locations = await this.locationRepository.findMany(location);

        return locations.length > 0 && locations[0].name.toLowerCase() === location;
    }
}