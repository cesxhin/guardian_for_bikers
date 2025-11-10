export interface IForecast {
    hourly: {
      time: string[]
      rain: number[]
      precipitation_probability: number[]
      temperature_2m: number[]
    }
}