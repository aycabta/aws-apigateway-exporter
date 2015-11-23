# AWS API Gateway Exporter

## Installation

At the start, you need to set up `~/.aws/credentials` and `~/.aws/config` what `aws-sdk` read:

```sh
$ aws configure
```

Next, run it:

```sh
$ npm install -g aws-apigateway-exporter
```

## Usage

If you run without options, it shows REST API list:

```sh
$ aws-apigateway-exporter 
Specify --rest-api option

REST APIs:
┌──────────────────┬────────────┐
│ name             │ ID         │
├──────────────────┼────────────┤
│ Swagger Petstore │ wow1veryID │
├──────────────────┼────────────┤
│ api-test         │ soIDmuchID │
└──────────────────┴────────────┘
```

If you run with only `--rest-api` option, it shows Stage list:

```sh
$ aws-apigateway-exporter --rest-api wow1veryID
Specify --stage option

Stages:
┌──────┬────────┐
│ name │ ID     │
├──────┼────────┤
│ prod │ SuchID │
└──────┴────────┘
```

If you run with `--rest-api` and `--stage` optins, it shows [Swagger](http://swagger.io/) JSON:

```sh
$ aws-apigateway-exporter --rest-api wow1veryID --stage SuchID
{
    "swagger": "2.0",
    "info": {
        "version": "1.0.0",
        "title": "Swagger Petstore",
......
```

## LICENSE

MIT
