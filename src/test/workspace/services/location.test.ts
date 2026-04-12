import axios from "axios";
import { expect, it, vi, describe } from "vitest";

import { LocationSerivce } from "../../../applications/services/locationService.ts";
import { IWeatherLocation } from "../../../domains/interfaces/api/IWeatherLocation.ts";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

describe("location-serivce", () => {
    const locationService = new LocationSerivce();

    describe("method: exist", () => {

        mockedAxios.get.mockResolvedValue({
            data: {
                results: [
                    {
                        latitude: 0,
                        longitude: 0,
                        name: "new-york",
                        timezone: "America/New_York"
                    },
                    {
                        latitude: 0,
                        longitude: 0,
                        name: "london",
                        timezone: "Europe/London"
                    },
                    {
                        latitude: 0,
                        longitude: 0,
                        name: "tokyo",
                        timezone: "Asia/Tokyo"
                    }
                ] satisfies IWeatherLocation[]
            }
        });

        it("check with uppercase", async () => {
            await expect(locationService.exist("TOKYO")).resolves.toStrictEqual({
                latitude: 0,
                longitude: 0,
                name: "tokyo",
                timezone: "Asia/Tokyo"
            });
        });

        it("check with Camel", async () => {
            await expect(locationService.exist("Tokyo")).resolves.toStrictEqual({
                latitude: 0,
                longitude: 0,
                name: "tokyo",
                timezone: "Asia/Tokyo"
            });
        });
        
        it("check with lowercase", async () => {
            await expect(locationService.exist("tokyo")).resolves.toStrictEqual({
                latitude: 0,
                longitude: 0,
                name: "tokyo",
                timezone: "Asia/Tokyo"
            });
        });
        
        it("check with mix", async () => {
            await expect(locationService.exist("ToKyO")).resolves.toStrictEqual({
                latitude: 0,
                longitude: 0,
                name: "tokyo",
                timezone: "Asia/Tokyo"
            });
        });
        
        it("not exist location", async () => {
            await expect(locationService.exist("not_exist")).resolves.toBeUndefined();
        });
    });
});