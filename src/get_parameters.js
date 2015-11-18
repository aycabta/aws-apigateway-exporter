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
                new Promise((accept, reject) => { accept(foundRestApi); }),
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
                this.stageNotFound({
                    stages: stages,
                    message: 'Specify --stage option'
                });
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
                stageNotFound(stages, 'The Stage "' + this.specifiedStage + '" not found');
            }
            return Promise.all([
                new Promise((accept, reject) => { accept(restApi); }),
                new Promise((accept, reject) => { accept(foundStage); }),
                this.apigateway.getResources({ restApiId: restApi.id }).promise()
            ]);
        });
    }

    go() {
        return this.getStage();
    }
}
