import _ from "lodash";
import winston from "winston";

import { LOG_LEVEL } from "../env";

export default (nameService: string) => winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        winston.format.printf(({ level, message, timestamp, service, ...args }) => {
            const meta = [];
            const symbols = Object.getOwnPropertySymbols(args);
            if (symbols.length == 2) {
                if (_.isArray(args[symbols[1]])){
                    for (const arg of (args[symbols[1]] as any[])) {
                        if (_.isObject(arg)){
                            meta.push(JSON.stringify(arg));
                        } else {
                            meta.push(arg);
                        }
                    }
                }
            }

            let messageLog = `[${timestamp}] [${level.toUpperCase()}] [${((service as string) || "unknown").toUpperCase()}] ${message}`;

            if (meta.length > 0){
                messageLog += ` ${meta.join(" ")}`;
            }
            
            return messageLog;
        })
    ),
    defaultMeta: { service: nameService },
    transports: [new winston.transports.Console()]
});