import _ from "lodash";
import { intro, log, outro } from "@clack/prompts";

import Docker from "dockerode";
import { DateTime } from "luxon";
import mongoose from "mongoose";

export default async () => {
    intro("Start backup");

    let docker: Docker
    
    try{
        docker = new Docker();
    }catch(err){
        log.error("Error connect socket docker, details: " + err);
        process.exit(1);
    }

    const containerDocker = await docker.listContainers({
        filters: {
          ancestor: ['mongo']
        }
    });

    if(containerDocker.length === 0){
        log.error("Not found container mongo");
        process.exit(1);
    }

    const container = docker.getContainer((containerDocker[0] as Docker.ContainerInfo).Id);

    const exec = await container.exec({
        Cmd: [
            'mongodump',
            `--archive=/data/db/backup-${mongoose.connection.db?.databaseName || "unknown"}-${DateTime.now().toFormat("yyyy-MM-dd HH-mm-ss")}.gz`,
            '--gzip'
        ],
        AttachStdout: true,
        AttachStderr: true,
        Tty: false
    });

    await new Promise<void>((resolve, reject) => {
        exec.start({}, (err, stream) => {
            if(err){
                return reject(err);
            }
            
            if(!_.isNil(stream)){
                let output = "";
                stream.on('data', chunk => output += chunk.toString());+
                stream.on('end', () => {
                    for (const message of output.split("\n")) {
                        log.info(message, {spacing: 0});
                    }

                    resolve();
                })
                stream.on('error', err => reject(err));
            }else{
                return reject(err);
            }
        });
    });

    outro("Complete backup!");
};