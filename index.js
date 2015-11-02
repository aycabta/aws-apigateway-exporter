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
})
.catch(err => {
    console.log('error!!!');
    console.log(err.stack);
    console.log(err);
});
