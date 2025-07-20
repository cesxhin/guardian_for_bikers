import { IForecast } from "../domains/interfaces/IForecast";
import { WeatherRepository } from "../repository/weatherRepository";

export class WeatherService {
    private weatherRepository = new WeatherRepository();
    
    async get(lat: number, lon: number): Promise<IForecast> {
        return await this.weatherRepository.get(lat, lon);
    }
}