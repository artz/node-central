/*jshint node: true*/
'use strict';

var vm = require('vm');

process.on('message', function (order) {
	var script = vm.runInNewContext(order.script, {
		require: require,
		module: module,
		setTimeout: setTimeout,
		clearTimeout: clearTimeout,
		console: console
	}, order.task + '.js');
	script(order.options, function (results) {
		process.send(results);
	});
});
