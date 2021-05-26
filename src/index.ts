import { CloudRun } from './cloud-run';
import core from "@actions/core";

async function run(): Promise<void> {
    try {
        const projectId = core.getInput("project_id");
        const serviceName = core.getInput("name");
        const serviceRegion = core.getInput("region");

        if (!serviceRegion) {
            throw new Error('Missing "name" input');
        }

        const cloudRunService = new CloudRun(serviceRegion, {
            projectId
        });

        const imageName = await cloudRunService.getServiceImage(serviceName);
        core.setOutput("image_name", imageName);
    } catch (error) {
        core.error(error);
        core.setFailed(error.message)
    }
}

run();
