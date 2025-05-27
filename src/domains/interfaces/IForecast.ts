import { IForecastDay } from "./IForecastDay";
import { IForecastHour } from "./IForecastHour";

export interface IForecast {
    current: IForecastDay,
    forecast: {
        forecastday: [{
            hour: IForecastHour[]
        }]
    }
}