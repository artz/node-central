/*jshint node: true*/
'use strict';

module.exports = {
	is: function (value, test) {
		return value === test;
	},
	isNot: function (value, test) {
		return value !== test;
	},
	isMoreThan: function (value, test) {
		return value > test;
	},
	isLessThan: function (value, test) {
		return value < test;
	}
};
