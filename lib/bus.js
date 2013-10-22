/*jshint node: true*/
'use strict';

var events = require('events');
var util = require('util');

// Returns a function that spits out messages to a callback
// function; those messages have been split by newline
// http://blog.gvm-it.eu/post/23791433751/extract-newline-seperated-messages-from-a-stream
function newLineStream(callback) {
	var buffer = '';
	return function (chunk) {

		var i = 0;
		var piece = '';
		var offset = 0;

		buffer += chunk;

		while ((i = buffer.indexOf('\n', offset)) !== -1) {
			piece = buffer.substr(offset, i - offset);
			offset = i + 1;
			callback(piece);
		}

		buffer = buffer.substr(offset);
	};
}

var Bus = function (connection) {

	var bus = this;
	events.EventEmitter.call(bus);

	connection.on('data', newLineStream(function (data) {
		data = JSON.parse(data.toString());
		if (data.event) {
			bus.emit(data.event, data.message);
		}
	}));

	bus.send = function (event, message, callback) {
		connection.write(JSON.stringify({
			event: event,
			message: message
		}) + '\n', callback);
	};

};

util.inherits(Bus, events.EventEmitter);

module.exports = Bus;
