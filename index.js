var AWS = require('aws-sdk-promise');
var loader = require('aws-sdk-config-loader');
var program = require('commander');

loader(AWS);

apigateway = new AWS.APIGateway();

apigateway.getRestApis({}).promise()
.then(result => {
    var restApiId = result.data.items[0].id;
    return Promise.all([
        apigateway.getStages({ restApiId: restApiId }).promise(),
        apigateway.getResources({ restApiId: restApiId }).promise(),
        new Promise((accept, reject) => { accept(result); })
    ]);
})
.then(result => {
    var stages = result[0].data;
    var resources = result[1].data;
    var restApis = result[2].data;
    var restApiId = restApis.items[0].id
    var toSwagger = {
        swagger: '2.0',
        info: {
            version: '1.0.0',
            title: restApis.items[0].name,
            description: restApis.items[0].description
        },
        host: `${restApiId}.execute-api.${"us-west-2"}.amazonaws.com`,
        basePath: `/${stages.item[0].stageName}`
    }
    var paths = {};
    resources.items.forEach(item => {
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
