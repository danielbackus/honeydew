'use strict';

const wait = (duration, val) =>
	new Promise(resolve => setTimeout(() => resolve(val), duration));

module.exports = class Worker {
	constructor(findTaskFunction, optionArg) {
		if (!findTaskFunction || typeof findTaskFunction !== 'function') {
			throw new Error('Missing argument "findTaskFunction"');
		}
		// collate arguments and defaults
		const defaults = {
			heartRate: 100,
			patience: 5000
		};
		const options = Object.assign({}, defaults, optionArg);

		// set some properties for singleton
		this.findTask = findTaskFunction;
		this.idle = true;
		this.patience = options.patience;
		this.heartRate = options.heartRate;
		this.pulse = null;

		// start looking for tasks on instantiation
		this.wake();
	}
	goIdle(err) {
		this.idle = true;
		return Promise.resolve();
	}
	heartbeat() {
		const worker = this;
		// if not busy
		if (worker && worker.idle) {
			worker.idle = false;
			const task = worker
				// find a task
				.findTask()
				// start doing the task
				.then(task => task.execute().then(worker.goIdle()))
				// catch errors and go idle
				.catch(e => worker.goIdle(e));
			// setup the timeout
			const timeout = wait(worker.patience).then(
				worker.goIdle(new Error('Timeout has occured'))
			);
			// return either the task result or timeout
			return Promise.race([task, timeout]);
		}
		// else we're still busy, resolve promise and try again next heartbeat
		return Promise.resolve();
	}
	wake() {
		const worker = this;
		if (!worker.pulse) {
			worker.pulse = setInterval(() => worker.heartbeat(), worker.heartRate);
		}
	}
	sleep() {
		clearInterval(this.pulse);
		this.pulse = null;
	}
};
