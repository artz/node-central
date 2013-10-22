/*jshint node: true*/
'use strict';

require('colors');

// TODO: Replace with https://github.com/marak/asciimo
console.log('                     __                .__   '.red);
console.log('  ____  ____   _____/  |_____________  |  |  '.red);
console.log('_/ ___\\/ __ \\ /    \\   __\\_  __ \\__  \\ |  |  '.red);
console.log('\\  \\__\\  ___/|   |  \\  |  |  | \\// __ \\|  |__'.red);
console.log(' \\___  >___  >___|  /__|  |__|  (____  /____/'.red);
console.log('     \\/    \\/     \\/                 \\/\n'.red);

var cfg = require('./config.json');
var net = require('net');
var fs = require('fs');
var Bus = require('./lib/bus');
var alert = require('./lib/alert');

function dispatch(bus, orders) {
	orders.forEach(function (order) {
		bus.send('central.order', order);
		if (order.interval) {
			setInterval(function () {
				bus.send('central.order', order);
			}, order.interval * 1000);
		}
	});
}

var connections = {};
function start(bus) {

	bus.on('scout.hello', function (message) {
		bus.name = message.name;
		connections[message.name] = bus;
		console.log('Scout connected: ' + message.name + ', sending orders.');
		dispatch(bus, cfg.orders);
	});

	bus.on('scout.script', function (order) {
		var scriptFile = './tasks/' + order.task + '.js';
		fs.readFile(scriptFile, {encoding: 'utf-8'}, function (error, script) {
			if (error) {
				console.log(scriptFile + ' not found, aborting order.');
			} else {
				console.log('Sending ' + scriptFile + ' to ' + bus.name + '.');
				order.script = script;
				bus.send('central.order', order);
			}
		});
	});

	bus.on('scout.done', function (order) {
		console.log('Received results from ' + bus.name + ':', order);
		var alerts = alert(order);
		if (alerts.length) {
			if (alerts.confirmed) {
				console.log((alerts.length + ' alert(s) confirmed:').red);
				alerts.forEach(function (alert) {
					console.log('☠ ' + alert.message.red);
				});
			} else {
				order.confirmation = true;
				console.log(alerts.length + ' alert(s) triggered, requesting scout confirmation.');
				bus.send('central.order', order);
			}
		}
	});

	bus.send('central.hello');
}

net.createServer(function (connection) {
	var bus = new Bus(connection);
	start(bus);
	connection.on('end', function () {
		console.log('Scout disconnected: ' + bus.name);
	});
	connection.on('error', function (error) {
		console.log('Scout connection error: ' + bus.name, error);
	});
	connection.on('close', function () {
		console.log('Scout connection closed: ' + bus.name);
		delete connections[bus.name];
	});
}).on('error', function (error) {
	console.log('Error:', error);
}).listen(cfg.port, function () {
	console.log('Central online, listening on port ' + cfg.port);
});
