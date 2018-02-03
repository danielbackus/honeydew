'use strict';

const Worker = require('../honeydew');
let instance;

/**
 * @module Singleton
 */
const singleton = (() => ({
	/**
	 * @param {Function} [findTask] findTask function to pass to Worker constructor, required on first call
	 * @param {Object} [options] Options object to pass to Worker constructor
	 * @param {Number} [options.heartRate] The number of milliseconds to wait before checking worker readiness
	 * @param {Number} [options.patience] The number of milliseconds to wait before a task times out
	 * @returns {Worker}
	 * On first call, instantiates a Worker as a singleton. On later calls, returns this singleton instance
	 */
	getInstance: function(findTask, options) {
		if (instance === undefined) {
			instance = new Worker(findTask, options);
		}
		return instance;
	}
}))();

module.exports = singleton;
