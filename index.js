var AWS = require('aws-sdk');
var utilities = require('./utilities');

AWS.config.update({ region: 'us-west-2' });
apigateway = new AWS.APIGateway();

utilities.promisify((params, callback) => {
    apigateway.getRestApis(params, callback);
})({})
.then(result => {
    var restApiId = result.items[0].id;
    return Promise.all([
        utilities.promisify((params, callback) => {
            apigateway.getStages(params, callback);
        })({ restApiId: restApiId }),
        utilities.promisify((params, callback) => {
            apigateway.getResources(params, callback);
        })({ restApiId: restApiId }),
        utilities.promisify((restApiId, callback) => {
            callback(null, restApiId);
        })(restApiId)
    ]);
})
.then(result => {
    var stages = result[0];
    var resources = result[1];
    var restApiId = result[2];
    var toSwagger = {
        swagger: '2.0',
        info: {
            version: '1.0.0',
            title: result.name
        },
        host: `${restApiId}.execute-api.${"us-west-2"}.amazonaws.com`,
        basePath: stages.item[0].stageName
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
