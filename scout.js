/*jshint node: true*/
'use strict';

require('colors');

// TODO: Replace with https://github.com/marak/asciimo
console.log('                            __   '.red);
console.log('  ______ ____  ____  __ ___/  |_ '.red);
console.log(' /  ___// ___\\/  _ \\|  |  \\   __\\'.red);
console.log(' \\___ \\\\  \\__(  <_> )  |  /|  |  '.red);
console.log('/____  >\\___  >____/|____/ |__|  '.red);
console.log('     \\/     \\/         \n'.red);

var cfg = require('./config.json');
var net = require('net');
var cp = require('child_process');
var Bus = require('./lib/bus');

var scripts = {};
function execute(order, callback) {
	var evil = cp.fork('./lib/process');

	var timer = setTimeout(function () {
		console.log('Too slow! Aborting task:', order.task);
		evil.kill();
		order.abort = true;
		delete order.script;
		callback(order);
	}, order.timeout * 1000);

	evil.on('message', function (results) {
		clearTimeout(timer);
		evil.kill();
		order.results = results;
		delete order.script;
		callback(order);
	});

	if (order.script) {
		scripts[order.task] = order.script;
	}
	evil.send(order);
}

function start(bus) {

	bus.on('central.hello', function () {
		console.log('Central acknowledged, requesting orders.');
		bus.send('scout.hello', {
			name: cfg.name
		});
	});

	bus.on('central.order', function (order) {

		console.log('Order received from Central, processing...');
		var task = order.task;

		if (order.script) {
			scripts[task] = order.script;
		}

		if (!scripts[task]) {
			console.log('Requesting "' + task + '" script from Central.');
			bus.send('scout.script', order);
			return;
		} else {
			order.script = scripts[task];
			execute(order, function (result) {
				bus.send('scout.done', result);
			});
		}
	});
}

function connect() {
	var connection = net.connect({
		port: cfg.port,
		host: cfg.host
	}, function () {
		var bus = new Bus(connection);
		start(bus);
	}).on('end', function () {
		console.log('Disconnected from Central, reconnecting in 10 seconds.');
		setTimeout(connect, 10000);
	}).on('error', function () {
		console.log('Unable to reach Central, retrying in 10 seconds.');
		setTimeout(connect, 10000);
	});
}

console.log('Connecting to Central at ' + cfg.host + ':' + cfg.port + '...');
connect();
