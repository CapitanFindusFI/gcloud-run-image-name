# `gcloud-run-image-name`
## Get CloudRun running service image name

#### Why?
Imagine of having a CloudRun service which is running a backend application, and serving some bundled .js files which are being referred inside the service's `env-vars`.

So basically you need to execute a CloudRun deploy inside a Github workflow with something like [`deploy-cloudrun`](https://github.com/google-github-actions/deploy-cloudrun) requiring an `image` parameter, which you don't have because of having to update just environment variables.

#### Solution
Using `gcloud-run-image-name` you can get the current image ID from a CloudRun running service by updating your workflow .yaml file as following

```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Get running image name
        id: run-get-image-name
        uses: CapitanFindusFI/gcloud-run-image-name@master
        with:
          project_id: ${{ GCP_PROJECT_ID }}
          region: ${{ GCP_REGION }}
          name: ${{ SERVICE_NAME }}
```

which will output `image` value, which can be used for `deploy-cloudrun` action as per the following example

```
jobs:
  build:
    runs-on: ubuntu-latest
    steps:      
      - name: Get running image name
        id: run-get-image-name
        uses: CapitanFindusFI/gcloud-run-image-name@master
        with:
          project_id: ${{ GCP_PROJECT_ID }}
          region: ${{ GCP_REGION }}
          name: ${{ SERVICE_NAME }}

      - name: Deploy to GCR Staging
        id: deploy-to-cloud-run-staging
        uses: google-github-actions/deploy-cloudrun@v0.5.0
        with:
          service: ${{ SERVICE_NAME }}
          image: ${{ steps.run-get-image-name.outputs.image }}
          env_vars: VAR_NAME=VAR_VALUE
          region: ${{ GCP_REGION }}
```