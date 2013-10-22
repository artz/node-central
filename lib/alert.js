/*jshint node: true*/
'use strict';

var cfg = require('../config.json');
var operate = require('./operate');

var events = {};

function resolve(string, object) {
	var keys = string.split('.'),
		result = object;
	keys.forEach(function (key) {
		result = result[key];
	});
	return result;
}

function template(string, object) {
	string = string.replace(/{{[^}]*}}/g, function (match) {
		match = match.substring(2, match.length - 2);
		return resolve(match, object);
	});
	return string;
}

// If this order requires
function alert(order) {

	var alerts = cfg.alerts[order.task];
	var results = order.results;
	var pass = true;
	var alertResults = [];

	alerts.forEach(function (taskAlert) {

		var criteria = taskAlert.criteria;
		var value;
		for (var field in criteria) {
			value = results[field];
			var operators = criteria[field];
			for (var operator in operators) {
				var test = operators[operator];
				if (operate[operator]) {
					if (operate[operator](value, test)) {
						pass = false;
						alertResults.push({
							event: taskAlert.event,
							criteria: taskAlert.criteria,
							message: template(taskAlert.message, order)
						});
					}
				} else {
					console.log('WARNING: Alert operator for "' + order.task + '" alert not found: ' + operator);
				}
			}
		}
	});

	if (order.confirmation) {
		alertResults.confirmed = true;
	}

	return alertResults;
}

module.exports = alert;
