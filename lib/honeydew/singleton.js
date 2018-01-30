'use strict';

const Worker = require('../honeydew');
let instance;

module.exports = (() => ({
	getInstance: function(options) {
		if (instance === undefined) {
			instance = new Worker(options);
		}
		return instance;
	}
}))();
