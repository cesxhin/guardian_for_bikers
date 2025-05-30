import axios from "axios";

import { ILocation } from "../domains/interfaces/ILocation";

export class LocationRepository {
    private URL_API = "https://api.open-meteo.com/v1/forecast";

    async findMany(location: string): Promise<{ results: ILocation[] }>{
        return (await axios.get(this.URL_API, {
            params: {
                name: location
            }
        })).data as { results: ILocation[] };
    }
}