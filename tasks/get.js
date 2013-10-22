/*jshint node: true*/
'use strict';

var http = require('http');
var https = require('https');
var Url = require('url');

module.exports = function (options, done) {

	var url = Url.parse(options.url);
	var httpModule = http;

	if (url.protocol.substr(0, 5) === 'https') {
		httpModule = https;
		url.port = url.port ? url.port : 443;
	} else {
		url.port = url.port ? url.port : 80;
	}

	var startTime = new Date().getTime();
	var results = {
		startTime: startTime,
		statusCode: null,
		connectTime: 0,
		responseTime: 0,
		connectTimeout: false,
		connectFailed: false,
		contentMatched: null
	};

	var body = [];
	var request = httpModule.request({
		port: url.port,
		host: url.host,
		path: url.path,
		headers: {
			'User-Agent': 'node-scout' ///' + scout.name + '/' + scout.version,
		},
		method:  'GET',
		agent:   false
	}, function (response) {

		results.statusCode = response.statusCode;
		results.connectTime = new Date() - startTime;

		// Clear the request timeout.
		// clearTimeout(connectTimeout);
		request.connectTimeout = false;

		response.setEncoding('utf8');
		response.on('data', function (chunk) {
			body.push(chunk);
		});

		response.on('end', function () {
			results.responseTime = new Date() - startTime;
			if (options.content) {
				if (body.join('').indexOf(options.content) >= 0) {
					results.contentMatched = true;
				} else {
					results.contentMatched = false;
				}
			}
			done(results);
		});
	});

	// Handle request timeouts.
/*
		var connectTimeout = setTimeout(function () {
		request.abort();
		results.connectTimeout = true;
		results.connectFailed = true;
		done(results);
	}, options.timeout * 1000);
*/
	// Attach error handler.
	request.on('error', function (error) {
		// clearTimeout(connectTimeout);
		results.connectFailed = true;
		results.error = error;
		done(results);
	});

	// End request and start response.
	request.end();
};
