'use strict';

/**
 * @function wait Promisified setTimeout
 * @param {Number} delay The number of milliseconds to wait before resolving the promise
 * @param {*} val The value to return when promise resolves
 * @returns {Promise<*>} A promise to resolve after the delay
 * @private
 */
const wait = (delay, val) =>
	new Promise(resolve => setTimeout(() => resolve(val), delay));

/**
 * @class Worker
 * @classdesc A worker class to automate promise-returning tasks
 */
class Worker {
	/**
	 * @constructor
	 * @param {Function} findTask A function that returns a function that returns a promise that constitutes a task
	 * @param {Object} [options]
	 * @param {Number} [options.heartRate] The number of milliseconds to wait before checking worker readiness
	 * @param {Number} [options.patience] The number of milliseconds to wait before a task times out
	 */
	constructor(findTask, options) {
		if (!findTask || typeof findTask !== 'function') {
			throw new Error('Missing argument "findTask"');
		}
		// collate arguments and defaults
		const defaults = {
			heartRate: 100,
			patience: 5000
		};
		options = Object.assign({}, defaults, options);
		// set some properties for instance
		this.findTask = findTask;
		this.idle = true;
		this.patience = options.patience;
		this.heartRate = options.heartRate;
		this.pulse = null;
		// start looking for tasks on instantiation
		this.wake();
	}
	/**
	 * Flags the Worker as ready for new tasks
	 * @param {Error} [err] Error returned by previous task
	 * @returns {Promise<void>}
	 * @private
	 */
	goIdle(err) {
		this.idle = true;
		return Promise.resolve();
	}
	/**
	 * Initiates the next task if the worker is ready
	 * @returns {Promise<void>}
	 * @private
	 */
	heartbeat() {
		const worker = this;
		// if not busy
		if (worker && worker.idle) {
			worker.idle = false;
			const task = worker
				// find a task
				.findTask()
				// start doing the task, go idle when finished
				.then(task => task.execute().then(worker.goIdle()))
				// or catch errors and go idle
				.catch(e => worker.goIdle(e));
			// setup the timeout, and go idle if it's reached
			const timeout = wait(worker.patience).then(
				worker.goIdle(new Error('Timeout has occured'))
			);
			// return either the task result or timeout, cleanup timeout
			return Promise.race([task, timeout]).then(() => clearTimeout(timeout));
		}
		// else we're still busy, resolve promise and try again next heartbeat
		return Promise.resolve();
	}
	/**
	 * Ensures the worker will look for new tasks
	 */
	wake() {
		const worker = this;
		if (!worker.pulse) {
			worker.pulse = setInterval(() => worker.heartbeat(), worker.heartRate);
		}
	}
	/**
	 * Ensures the worker will not look for new tasks
	 */
	sleep() {
		clearInterval(this.pulse);
		this.pulse = null;
	}
}

const foo = require('./foo');

module.exports = Worker;
