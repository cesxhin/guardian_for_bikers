import { IForecast } from "../domains/interfaces/IForecast";
import { WeatherRepository } from "../repository/weatherRepository";

export class WeatherService {
    private weatherRepository = new WeatherRepository();
    
    async get(location: string): Promise<IForecast> {
        return await this.weatherRepository.get(location);
    }

    getMessage(data: IForecast): string {
        let message = `Hello bikers! Let's see what the weather has to offer today!\n\n`;

        for (const hour of data.forecast.forecastday[0].hour) {
            message += `${hour.time.split(' ')[1]} - ${hour.temp_c}°C ${hour.will_it_rain == 1? '🌧️' : '☀️'} ${hour.will_it_rain? `${hour.chance_of_rain}%` : '' }\n`
        }

        return message;
    }
}