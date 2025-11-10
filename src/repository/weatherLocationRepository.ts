import axios from "axios";

import { IWeatherLocation } from "../domains/interfaces/api/IWeatherLocation";

export class LocationRepository {
    private URL_API = "https://geocoding-api.open-meteo.com/v1/search";

    async findMany(location: string): Promise<{ results: IWeatherLocation[] }>{
        return (await axios.get(this.URL_API, {
            params: {
                name: location
            }
        })).data as { results: IWeatherLocation[] };
    }
}