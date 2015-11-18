var AWS = require('aws-sdk-promise');
var loader = require('aws-sdk-config-loader');
var Table = require('cli-table');
var program = require('commander');

program
  .version(require('./package.json').version)
  .usage('[options]')
  .option('--rest-api <REST API name or ID>', 'The name or ID of the REST API')
  .option('--stage <stage name or ID>', 'The name or ID of the Stage')
  .parse(process.argv);

loader(AWS);

apigateway = new AWS.APIGateway();

function restApiNotFound(restApis, message) {
    var table = new Table();
    table.push(['name', 'ID']);
    restApis.forEach((restApi) => {
        table.push([restApi.name, restApi.id]);
    });
    console.log(message);
    console.log('');
    console.log('REST APIs:');
    console.log(table.toString());
    process.exit(1);
}

function stageNotFound(stages, message) {
    var table = new Table();
    table.push(['name', 'ID']);
    stages.forEach((stage) => {
        table.push([stage.stageName, stage.deploymentId]);
    });
    console.log(message);
    console.log('');
    console.log('Stages:');
    console.log(table.toString());
    process.exit(2);
}

apigateway.getRestApis({}).promise()
.then(result => {
    if (!program.restApi) {
        restApiNotFound(result.data.items, 'Specify --rest-api option');
    }
    return result;
})
.then(result => {
    var foundRestApi = result.data.items.find((restApi) => {
        if (restApi.name === program.restApi || restApi.id === program.restApi) {
            return true;
        } else {
            return false;
        }
    });
    if (!foundRestApi) {
        restApiNotFound(result.data.items, 'The REST API "' + program.restApi + '" not found');
    }
    var restApiId = foundRestApi.id;
    return Promise.all([
        apigateway.getStages({ restApiId: restApiId }).promise(),
        apigateway.getResources({ restApiId: restApiId }).promise(),
        new Promise((accept, reject) => { accept(foundRestApi); })
    ]);
})
.then(result => {
    var stages = result[0].data.item;
    var resources = result[1].data.items;
    var restApi = result[2];
    console.log(restApi);
    console.log(stages);
    console.log(resources);
    if (!program.stage) {
        stageNotFound(stages, 'Specify --stage option');
    }
    var foundStage = stages.find((stage) => {
        if (stage.stageName === program.stage || stage.deploymentId === program.stage) {
            return true;
        } else {
            return false;
        }
    });
    if (!foundStage) {
        stageNotFound(stages, 'The Stage "' + program.stage + '" not found');
    }
    var toSwagger = {
        swagger: '2.0',
        info: {
            version: '1.0.0',
            title: restApi.name,
            description: restApi.description
        },
        host: `${restApi.id}.execute-api.${"us-west-2"}.amazonaws.com`,
        basePath: `/${foundStage.stageName}`
    }
    var paths = {};
    resources.forEach(item => {
        if (item.resourceMethods) {
            var path = {};
            paths[item.path] = {};
            Object.keys(item.resourceMethods).forEach(method => {
                paths[item.path][method.toLowerCase()] = {
                    responses: {
                        200: {
                            description: ''
                        }
                    }
                };
            });
        }
    });
    toSwagger.paths = paths;
    console.log(JSON.stringify(toSwagger, '', '    '));
})
.catch(err => {
    console.log('error!!!');
    console.log(err.stack);
    console.log(err);
});
