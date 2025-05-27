import winston from "winston";
import { LOG_LEVEL } from "../env";

export default (nameService: string) => winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(({ level, message, timestamp, service }) => {
            return `[${timestamp}] [${level.toUpperCase()}] [${((service as string) || "unknown").toUpperCase()}] ${message}`;
        })
    ),
    defaultMeta: { service: nameService },
    transports: [
        new winston.transports.Console()
    ]
});