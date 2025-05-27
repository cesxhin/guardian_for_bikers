import axios from "axios";

import { TOKEN_WEATHER } from "../env";
import { IForecast } from "../domains/interfaces/IForecast";

export class WeatherRepository {
    private URL_API = "https://api.weatherapi.com/v1/forecast.json"

    async get(location: string): Promise<IForecast>{
        return (await axios.get(this.URL_API, {
            params: {
                q: location,
                aqi: "no",
                alerts: "no",
                key: TOKEN_WEATHER
            }
        })).data as IForecast;
    }
}