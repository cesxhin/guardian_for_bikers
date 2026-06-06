import _ from "lodash";

import Logger from "../lib/logger.ts";
import { VERSION_CURRENT_DB } from "../env.ts";
import { modelUser } from "../domains/models/userMode.ts";
import { modelPoll } from "../domains/models/pollModel.ts";
import { UpdateVersionNotFound } from "./exceptionsUtils.ts";
import { IVersion } from "../domains/interfaces/IVersion.ts";
import { modelVersion } from "../domains/models/versionModel.ts";

const logger = Logger("version-utils");
const NAME_VERSION = "gfb";

async function main(){
    const find: IVersion | null = await modelVersion.findOne({name: NAME_VERSION}).lean();

    if (_.isNil(find)){
        logger.debug(`Not found version for ${NAME_VERSION}`);
        modelVersion.insertOne({name: NAME_VERSION, version: VERSION_CURRENT_DB});
        logger.info(`Created version for ${NAME_VERSION}`);
    } else {
        const updaters: (() => Promise<void>)[] = [
            v2,
            v3
        ];

        if (VERSION_CURRENT_DB !== (updaters.length + 1)){
            logger.error(`Missing function for migration v${VERSION_CURRENT_DB}`);
            process.exit(1);
        }

        for (let version = find.version; version < (updaters.length + 1); version++){
            logger.info(`Start migration v${version} to v${version + 1}...`);

            await updaters[version - 1]?.();

            await updateVersion(version + 1);
            logger.info(`Complete migration v${version + 1}`);
        }
    }
}

async function v2(){
    const countUsers = (await modelUser.updateMany({},
        {
            scoreMultiplier: 0,
            updated: new Date(),
            totalKm: 0
        }
    )).modifiedCount;
    logger.info(`Updated total users (${countUsers})`);

    const countPoll = (await modelPoll.updateMany({},
        {
            updated: new Date(),
            created: new Date(),
            target_impostor: null
        }
    )).modifiedCount;
    logger.info(`Updated total polls (${countPoll})`);
}

async function v3(){
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
    logger.info(`Updated total users (${countUsers})`);
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