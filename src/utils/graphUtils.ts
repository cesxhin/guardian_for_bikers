import _ from "lodash";
import path from "path";
import { readFileSync } from "fs";
import { loadImage, createCanvas } from "canvas";
import { Chart, Filler, LinearScale, LineController, LineElement, Plugin, PointElement, TimeScale } from "chart.js";
import "chartjs-adapter-luxon"; //after chartjs
import Logger from "../lib/logger";

Chart.register(TimeScale, LinearScale, LineController, PointElement, LineElement, Filler);
      
const SIZE_EMOJI = 24;

const emojiSun = await loadImage(readFileSync(path.join(path.resolve(), "assets/sunny.png")));
const emojiDroplet = await loadImage(readFileSync(path.join(path.resolve(), "assets/droplet.png")));
const emojiRain = await loadImage(readFileSync(path.join(path.resolve(), "assets/rain_cloud.png")));

Chart.defaults.animation = false;
Chart.defaults.responsive = false;

const logger = Logger("graph-utils");

const emojiPlugin: Plugin = {
    id: "emojiPlugin",
    afterDraw(chart, args, options) {
        const ctx = chart.ctx;
        const xAxis = chart.scales["xEmoji"];

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        for (const index in xAxis.ticks) {
            const x = xAxis.getPixelForTick(Number(index));
        
            const actualWeather = options.dataWeather[index];

            if (!_.isNil(actualWeather)){
                ctx.drawImage((actualWeather.startsWith("0")? emojiSun : actualWeather.startsWith("1")? emojiDroplet : emojiRain) as any, x - (SIZE_EMOJI / 2), xAxis.top - 25, SIZE_EMOJI, SIZE_EMOJI);

                if (actualWeather.startsWith("1")){

                    const poin = chart.getDatasetMeta(0).data[index];

                    const percentage = actualWeather.split("1 - ")[1];
                    ctx.fillText(`${percentage}%`, poin.x, poin.y + 19);
                }
            } else {
                logger.error("Cannot draw on chart");
            }
        }

        ctx.restore();
    }
};

const backgroundPlugin: Plugin = {
    id: "custom_canvas_background_color",
    beforeDraw: (chart) => {
        const ctx = chart.canvas.getContext("2d");
        ctx.save();
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
    }
};

async function render(width: number, height: number, headers: (number | string)[], data: (number | string)[], dataWeather: (number | string)[]): Promise<Buffer> {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 200, 200);
    
    const chart = new Chart(
        canvas as any,
        {
            type: "line",
            data: {
                datasets: [
                    {
                        data: data.map((_, index) => { return {x: headers[index], y: data[index]}; }),
                        borderColor: "#FF6500",
                        backgroundColor: "rgba(255, 101, 0, 0.25)",
                        fill: true
                    }, {
                        data: data.map((_, index) => { return {x: headers[index], y: data[index]}; }),
                        xAxisID: "xEmoji"
                    }
                ]
            },
            options: {
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 0
                    },
                    line: {
                        tension: 0.4
                    }
                },
                layout: {
                    padding: {
                        top: 30,
                        left: 15,
                        right: 5
                    }
                },
                plugins: {
                    //@ts-ignore
                    emojiPlugin: {
                        dataWeather
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        type: "time",
                        grid: {
                            display: false
                        },
                        time: {
                            unit: "hour",
                            displayFormats: {
                                hour: "HH"
                            }
                        }
                    },
                    xEmoji: {
                        type: "time",
                        position: "top",
                        display: false,
                        grid: {
                            drawOnChartArea: false,
                            display: false
                        },
                        time: {
                            unit: "hour",
                            displayFormats: {
                                hour: "HH"
                            }
                        }
                    },
                    y: {
                        ticks: {
                            callback: (val) => val.toString().padStart(2, "0") + " °C"
                        },
                        grid: {
                            display: false
                        },
                        position: "right"
                    }
                }
            },
            plugins: [emojiPlugin, backgroundPlugin]
        }
    );

    const bufferImage = canvas.toBuffer("image/png");

    chart.destroy();

    return bufferImage;
}

export default {
    render
};