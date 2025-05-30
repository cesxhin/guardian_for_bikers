import axios from "axios";

import { IForecast } from "../domains/interfaces/IForecast";

export class WeatherRepository {
    private URL_API = "https://api.open-meteo.com/v1/forecast";

    async get(lat: number, lon: number): Promise<IForecast>{
        return (await axios.get(this.URL_API, {
            params: {
                latitude: lat,
                longitude: lon,
                forecast_days: 1,
                hourly: ["rain", "precipitation_probability", "temperature_2m"]
            }
        })).data as IForecast;
    }
}