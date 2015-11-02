var AWS = require('aws-sdk');
var utilities = require('./utilities');

AWS.config.update({ region: 'us-west-2' });
apigateway = new AWS.APIGateway();

utilities.promisify((params, callback) => {
    apigateway.getRestApis(params, callback);
})({})
.then(result => {
    return utilities.promisify((params, callback) => {
        apigateway.getResources(params, (err, hopstep) => {
            hopstep.name = result.items[0].name;
            callback(err, hopstep);
        });
    })({ restApiId: result.items[0].id });
})
.then(result => {
    var toSwagger = {
        swagger: '2.0',
        info: {
            version: '1.0.0',
            title: result.name
        }
    }
    var paths = {};
    result.items.forEach(item => {
        if (item.resourceMethods) {
            var path = {};
            paths[item.path] = {};
            Object.keys(item.resourceMethods).forEach(method => {
                paths[item.path][method.toLowerCase()] = {};
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
