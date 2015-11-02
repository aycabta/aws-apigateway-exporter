var AWS = require('aws-sdk');
var utilities = require('./utilities');

AWS.config.update({ region: 'us-west-2' });
apigateway = new AWS.APIGateway();

utilities.promisify((params, callback) => {
    apigateway.getRestApis(params, callback);
})({})
.then(result => {
    console.log('======== getRestApis()');
    console.log(result);
    return Promise.all([
        utilities.promisify((params, callback) => {
            apigateway.getStages(params, callback);
        })({ restApiId: result.items[0].id }),
        utilities.promisify((params, callback) => {
            apigateway.getResources(params, callback);
        })({ restApiId: result.items[0].id })
    ]);
})
.then(result => {
    console.log('======== getStages()');
    console.log(result[0]);
    console.log('======== getResources()');
    console.log(result[1]);
})
.catch(err => {
    console.log('error!!!');
    console.log(err.stack);
    console.log(err);
});
