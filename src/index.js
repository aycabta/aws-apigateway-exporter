#!/usr/bin/env node

import program from 'commander';
import GetParameters from '../lib/get_parameters';

program
    .version(require('../package.json').version)
    .usage('[options]')
    .option('--rest-api <REST API name or ID>', 'The name or ID of the REST API')
    .option('--stage <stage name or ID>', 'The name or ID of the Stage')
    .parse(process.argv);

new GetParameters({
    specifiedRestApi: program.restApi,
    specifiedStage: program.stage
}).go()
.then(result => {
    var restApi = result[0];
    var stage = result[1];
    var resources = result[2];
    var models = result[3];
    var toSwagger = {
        swagger: '2.0',
        info: {
            version: '1.0.0',
            title: restApi.name,
            description: restApi.description
        },
        host: `${restApi.id}.execute-api.${"us-west-2"}.amazonaws.com`,
        basePath: `/${stage.stageName}`
    }
    var paths = {};
    resources.forEach(item => {
        if (item.resourceMethods) {
            var path = {};
            paths[item.path] = {};
            Object.keys(item.resourceMethods).forEach(method => {
                var responses = {};
                Object.keys(item.resourceMethods[method].methodResponses).forEach(statusCode => {
                    responses[statusCode] = {
                        description: ''
                    };
                });
                paths[item.path][method.toLowerCase()] = { responses: responses };
            });
        }
    });
    toSwagger.paths = paths;
    var definitions = {};
    models.forEach(item => {
        definitions[item.name] = JSON.parse(item.schema);
    });
    toSwagger.definitions = definitions;
    console.log(JSON.stringify(toSwagger, '', '    '));
})
.catch(err => {
    console.log(err.message);
});
