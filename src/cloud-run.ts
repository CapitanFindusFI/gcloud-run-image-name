import core from "@actions/core";
import { Compute, GoogleAuth, JWT, UserRefreshClient } from "google-auth-library";
import { google, run_v1 } from "googleapis";
import { GaxiosResponse, MethodOptions } from "googleapis-common";

type AuthClientType = JWT | Compute | UserRefreshClient | undefined;

interface ClientOptions {
    credentials?: string;
    projectId?: string;
}

export class CloudRun {
    private methodOptions: MethodOptions;

    private run = google.run('v1');
    private authClient: AuthClientType;

    readonly auth: GoogleAuth;
    readonly parent: string;
    readonly endpoint: string;

    constructor(region: string, options?: ClientOptions) {
        let projectId = options?.projectId;
        if (
            !options?.credentials &&
            (!process.env.GCLOUD_PROJECT ||
                !process.env.GOOGLE_APPLICATION_CREDENTIALS)
        ) {
            throw new Error(
                'No method for authentication. Set credentials in this action or export credentials from the setup-gcloud action',
            );
        }

        this.auth = new google.auth.GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        // Set credentials
        let JSONContent;
        if (options?.credentials) {
            let credentials = options?.credentials;
            if (!options?.credentials.trim().startsWith("{")) {
                credentials = Buffer.from(credentials, "base64").toString("utf-8");
            }
            JSONContent = JSON.parse(credentials);
            this.auth.jsonContent = JSONContent;
        }

        // Set project Id
        if (!projectId && JSONContent && JSONContent.project_id) {
            projectId = JSONContent.project_id;
            core.info("Setting project Id from credentials");
        } else if (!projectId && process.env.GCLOUD_PROJECT) {
            projectId = process.env.GCLOUD_PROJECT;
            core.info("Setting project Id from $GCLOUD_PROJECT");
        } else {
            throw new Error('No project Id found. set "project_id" input.');
        }

        this.parent = `namespaces/${projectId}`;
        this.endpoint = `https://${region}-run.googleapis.com`;
        this.methodOptions = { rootUrl: this.endpoint };
    }

    async getAuthClient(): Promise<AuthClientType> {
        if (!this.authClient) {
            try {
                this.authClient = (await this.auth.getClient() as AuthClientType);
            } catch (error) {
                core.error(`Unable to retrieve authenticated client: ${error}`);
            }
        }

        return this.authClient;
    }

    getResource(serviceName: string): string {
        return `${this.parent}/services/${serviceName}`;
    }

    async getService(serviceName: string): Promise<run_v1.Schema$Service> {
        const authClient = await this.getAuthClient();
        const getRequest: run_v1.Params$Resource$Namespaces$Services$Get = {
            name: this.getResource(serviceName),
            auth: authClient
        };
        const getResponse: GaxiosResponse<run_v1.Schema$Service> = await this.run.namespaces.services.get(
            getRequest, this.methodOptions
        );

        return getResponse.data;
    }

    async getServiceImage(serviceName: string): Promise<string> {
        const service = await this.getService(serviceName);
        console.log(service);

        return 'dio boia';
    }
}