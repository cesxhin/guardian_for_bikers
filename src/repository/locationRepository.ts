import axios from "axios";

import { TOKEN_WEATHER } from "../env";
import { IForecast } from "../domains/interfaces/IForecast";
import { ILocation } from "../domains/interfaces/ILocation";

export class LocationRepository {
    private URL_API = "https://api.weatherapi.com/v1/search.json"

    async findMany(location: string): Promise<ILocation[]>{
        return (await axios.get(this.URL_API, {
            params: {
                q: location,
                key: TOKEN_WEATHER
            }
        })).data as ILocation[];
    }
}