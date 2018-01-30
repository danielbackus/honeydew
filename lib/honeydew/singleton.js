'use strict';

const Worker = require('../honeydew');
let instance;

module.exports = (() => ({
	getInstance: function() {
		if (instance === undefined) {
			instance = new Worker(...Array.from(arguments));
		}
		return instance;
	}
}))();
