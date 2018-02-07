# Honeydew 🍈

[![Build Status](https://travis-ci.org/nosleepnotever/honeydew.svg?branch=master)](https://travis-ci.org/nosleepnotever/honeydew) [![Coverage Status](https://coveralls.io/repos/github/nosleepnotever/honeydew/badge.svg?branch=master)](https://coveralls.io/github/nosleepnotever/honeydew?branch=master) [![Known Vulnerabilities](https://snyk.io/test/github/nosleepnotever/honeydew/badge.svg?targetFile=package.json)](https://snyk.io/test/github/nosleepnotever/honeydew?targetFile=package.json)

Honeydew is a lightweight helper to monitor & automate promise-returning tasks with NO dependencies.

This utility grew out of frustration with promise queue strategies when executing large numbers of async tasks. Chaining promises requires thorough error handling, or it is easy for errors to cascade with the result that the remainder of your promised tasks are never attempted.

Honeydew is a monitor utility that, rather than queuing the entire workload, looks for a unit of work, executes it, awaits the promise's resolution, rejection, or timeout, and then repeats this process. The intention here is to create a more stable way of executing large numbers of async tasks, that is resilient to promise rejections, timeouts, and can recover smoothly from unexpected stops.

## Installation

`npm i honeydew`

## Usage

```js
const { Worker } = require('honeydew');

// findTask parameter is the only required parameter for Worker instantiation
// this will generally be a database query
// to find relevant work to be done
const findTask = () => {
	// this function must return a promise
	return db.Requests.findOne({ status: 'Queued' }).then(request => {
		// this promise must return a function
		const task = () => {
			// when this function is executed, it must return a promise
			// this is the actual unit of work to be done
			return VendorAPI.post(request).then(res => {
				const response = Object.assign({}, res, { request: request._id });
				return db.Responses.create(response);
			});
		};
		return task;
	});
};

// on initialization, the worker will begin to find and run tasks
const worker = new Worker(findTask);
```

## Tests

`npm test`

## To-Do

* [x] Document with JSDoc
* [ ] Implement parallel execution of multiple tasks up to options.maxTasks
* [ ] Log or return promise rejections and timeouts appropriately according to options.errorHandling

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.
