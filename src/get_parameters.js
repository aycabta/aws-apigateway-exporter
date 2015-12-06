import AWS from 'aws-sdk-promise';
import loader from 'aws-sdk-config-loader';
import Table from 'cli-table';

loader(AWS);

export default class GetParameters {
    constructor({ specifiedRestApi, specifiedStage }) {
        this.apigateway = new AWS.APIGateway();
        this.specifiedRestApi = specifiedRestApi;
        this.specifiedStage = specifiedStage;
    }

    restApiNotFound({ restApis, message }) {
        var table = new Table();
        table.push(['name', 'ID']);
        restApis.forEach((restApi) => {
            table.push([restApi.name, restApi.id]);
        });
        var log = message + "\n";
        log += "\n";
        log += "REST APIs:\n";
        log += table.toString();
        return log;
    }

    stageNotFound({ stages, message }) {
        var table = new Table();
        table.push(['name', 'ID']);
        stages.forEach((stage) => {
            table.push([stage.stageName, stage.deploymentId]);
        });
        var log = message + "\n";
        log += "\n";
        log += "Stages:\n";
        log += table.toString();
        return log;
    }

    getRestApi() {
        return this.apigateway.getRestApis({}).promise()
        .then(result => {
            if (!this.specifiedRestApi) {
                return Promise.reject(new Error(this.restApiNotFound({
                    restApis: result.data.items,
                    message: 'Specify --rest-api option'
                })));
            }
            return result;
        })
        .then(result => {
            var foundRestApi = result.data.items.find((restApi) => {
                if (restApi.name === this.specifiedRestApi || restApi.id === this.specifiedRestApi) {
                    return true;
                } else {
                    return false;
                }
            });
            if (!foundRestApi) {
                return Promise.reject(new Error(this.restApiNotFound({
                    restApis: result.data.items,
                    message: 'The REST API "' + this.specifiedRestApi + '" not found'
                })));
            }
            return Promise.all([
                Promise.resolve(foundRestApi),
                this.apigateway.getStages({ restApiId: foundRestApi.id }).promise()
            ]);
        });
    }

    getStage() {
        return this.getRestApi()
        .then(result => {
            var restApi = result[0];
            var stages = result[1].data.item;
            if (!this.specifiedStage) {
                return Promise.reject(new Error(this.stageNotFound({
                    stages: stages,
                    message: 'Specify --stage option'
                })));
            }
            var foundStage = stages.find((stage) => {
                if (stage.stageName === this.specifiedStage || stage.deploymentId === this.specifiedStage) {
                    return true;
                } else {
                    return false;
                }
            });
            if (!foundStage) {
                return Promise.reject(new Error(this.stageNotFound({
                    stages: stages,
                    message: 'The Stage "' + this.specifiedStage + '" not found'
                })));
            }
            return Promise.all([
                Promise.resolve(restApi),
                Promise.resolve(foundStage),
                this.apigateway.getResources({ restApiId: restApi.id }).promise()
            ]);
        });
    }

    getMethodAndIntegration({ resource, restApiId }) {
        if (resource.resourceMethods) {
            return Object.keys(resource.resourceMethods).reduce((promise, method) => {
                return promise
                .then(() => {
                    return this.apigateway.getMethod({
                        httpMethod: method,
                        resourceId: resource.id,
                        restApiId: restApiId
                    }).promise()
                })
                .then(result => {
                    resource.resourceMethods[method] = result.data;
                    return resource;
                });
            }, Promise.resolve());
        } else {
            return Promise.resolve(resource);
        }
    }

    go() {
        return this.getStage()
        .then(result => {
            var restApi = result[0];
            var stage = result[1];
            var resources = result[2].data.items;
            return Promise.all([
                Promise.resolve(restApi),
                Promise.resolve(stage),
                Promise.resolve(resources),
                this.apigateway.getModels({ restApiId: restApi.id }).promise()
            ]);
        })
        .then(result => {
            var recordValue = ((results, value) => {
                results.push(value);
                return results;
            }).bind(null, []);
            var restApi = result[0];
            var stage = result[1];
            var resources = result[2];
            var models = result[3].data.items;
            resources = resources.reduce((promise, resource) => {
                return promise
                .then(() => {
                    return this.getMethodAndIntegration({
                        resource: resource,
                        restApiId: restApi.id
                    })
                })
                .then(recordValue);
            }, Promise.resolve());
            return Promise.all([
                Promise.resolve(restApi),
                Promise.resolve(stage),
                resources,
                Promise.resolve(models)
            ]);
        })
    }
}
