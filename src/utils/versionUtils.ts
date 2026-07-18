import _ from "lodash";
import winston from "winston";
import mongoose from "mongoose";

import Logger from "../lib/logger.ts";
import { VERSION_CURRENT_DB } from "../env.ts";
import { modelUser } from "../domains/models/userMode.ts";
import { modelEvent } from "../domains/models/eventModel.ts";
import { UpdateVersionNotFound } from "./exceptionsUtils.ts";
import { IVersion } from "../domains/interfaces/IVersion.ts";
import { modelVersion } from "../domains/models/versionModel.ts";
import { modelTrack } from "../domains/models/trackModel.ts";

const logger = Logger("version-utils");
const NAME_VERSION = "gfb";

async function main(){
    const find: IVersion | null = await modelVersion.findOne({name: NAME_VERSION}).lean();

    if (_.isNil(find)){
        logger.debug(`Not found version for ${NAME_VERSION}`);
        modelVersion.insertOne({name: NAME_VERSION, version: VERSION_CURRENT_DB});
        logger.info(`Created version for ${NAME_VERSION}`);
    } else {
        const updaters: ((loggerV: winston.Logger) => Promise<void>)[] = [
            v2,
            v3
        ];

        if (VERSION_CURRENT_DB !== (updaters.length + 1)){
            logger.error(`Missing function for migration v${VERSION_CURRENT_DB}`);
            process.exit(1);
        }

        for (let version = find.version; version < (updaters.length + 1); version++){
            logger.info(`Start migration v${version} to v${version + 1}...`);

            try {
                await updaters[version - 1]?.(Logger("version-"+version.toString()));
            } catch(err){
                logger.error(`Failed update v${version + 1}, details:`, err);
                process.exit(1);
            }

            await updateVersion(version + 1);
            logger.info(`Complete migration v${version + 1}`);
        }
    }
}

async function v2(loggerV: winston.Logger){
    const countUsers = (await modelUser.updateMany({},
        {
            scoreMultiplier: 0,
            updated: new Date(),
            totalKm: 0
        }
    )).modifiedCount;
    loggerV.info(`Updated total users (${countUsers})`);

    const countPoll = (await modelEvent.updateMany({},
        {
            updated: new Date(),
            created: new Date(),
            target_impostor: null
        }
    )).modifiedCount;
    loggerV.info(`Updated total polls (${countPoll})`);
}

async function v3(loggerV: winston.Logger){
    const countUsers = (await modelUser.collection.updateMany({},
        {
            $set: {
                consecutive: 0
            },
            $unset: {
                scoreMultiplier: ""
            }
        }
    )).modifiedCount;
    loggerV.info(`Updated total users (${countUsers})`);

    await modelTrack.deleteMany({});
    loggerV.info("Delete all tracks");

    if (await mongoose.connection.db?.dropCollection("polls")){
        loggerV.info("Deleted old collection \"polls\"");
    } else {
        loggerV.warn("Failed drop old collection \"polls\"");
    }
}

async function updateVersion(currentVersion: number): Promise<IVersion> {
    const update = await modelVersion.findOneAndUpdate({name: NAME_VERSION }, { version: currentVersion }, {returnDocument: "after"}).lean();

    if (_.isNil(update)){
        throw new UpdateVersionNotFound("Not found document for update version");
    }

    return update;
}

export default {
    main
};