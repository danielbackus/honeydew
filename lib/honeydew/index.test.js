'use strict';

const test = require('ava').test;
const Worker = require('../honeydew');
const wait = (duration, val) =>
	new Promise(resolve => setTimeout(() => resolve(val), duration));
const td = require('testdouble');
const findTaskFunction = () => wait(50);

test('promise returned by wait() resolves after duration', t =>
	wait(50).then(() => t.pass()));
test.serial('constructor calls wake', t => {
	const wake = Worker.prototype.wake;
	Worker.prototype.wake = td.function();
	const worker = new Worker(findTaskFunction);
	t.notThrows(() => td.verify(Worker.prototype.wake()));
	Worker.prototype.wake = wake;
});
test('instantiating Worker without a findTaskFunction argument throws', t => {
	t.throws(() => {
		new Worker();
	});
	t.throws(() => {
		new Worker({});
	});
});
test('goIdle() sets idle to true', t => {
	const worker = new Worker(findTaskFunction);
	return worker.goIdle().then(() => t.is(worker.idle, true));
});
test('wake() sets pulse to a function', t => {
	const worker = new Worker(findTaskFunction);
	worker.pulse = null;
	worker.wake();
	t.is(typeof worker.pulse, 'object');
	t.is(worker.pulse._idleTimeout, worker.heartRate);
});
test('after wake(), heartbeat is called within heartRate', t => {
	const worker = new Worker(findTaskFunction);
	worker.heartbeat = td.function();
	worker.wake();
	return wait(worker.heartRate).then(() => {
		t.notThrows(() => td.verify(worker.heartbeat()));
	});
	worker = null;
});
test('sleep sets worker.pulse to null', t => {
	const worker = new Worker(findTaskFunction);
	worker.sleep();
	t.is(worker.pulse, null);
});
test('after sleep() is called, heartbeat is not called after heartRate', t => {
	const worker = new Worker(findTaskFunction);
	worker.heartbeat = td.function();
	worker.sleep();
	return wait(worker.heartRate).then(() => {
		t.throws(() => td.verify(worker.heartbeat));
	});
});
test('when heartbeat() is called, if worker.idle, findTask is called()', t => {
	const worker = new Worker(findTaskFunction);
	worker.sleep();
	worker.findTask = td.function();
	td.when(worker.findTask()).thenReturn(Promise.resolve());
	worker.idle = true;
	return worker.heartbeat().then(() => t.pass());
});
test('when heartbeat() is called, if !worker.idle, findTask is not called()', t => {
	const worker = new Worker(findTaskFunction);
	worker.sleep();
	worker.findTask = td.function();
	worker.idle = false;
	return worker.heartbeat().then(() => {
		t.throws(() => td.verify(worker.findTask()));
	});
});
test('when heartbeat() is called && worker.idle, call worker.findTask().execute()', t => {
	const execute = td.function();
	const taskFinder = td.function();
	td.when(taskFinder()).thenResolve({ execute });
	td.when(execute()).thenResolve();
	const worker = new Worker(taskFinder);
	worker.sleep();
	worker.idle = true;
	return worker.heartbeat().then(() => t.pass());
});
test('if findTask().execute() completes before worker.patience elapses, goIdle is called with no params', t => {
	const execute = td.function();
	const taskFinder = td.function();
	td.when(taskFinder()).thenResolve({ execute });
	td.when(execute()).thenResolve();
	const worker = new Worker(taskFinder);
	worker.sleep();
	worker.goIdle = td.function();
	worker.idle = true;
	return worker.heartbeat().then(() => {
		t.notThrows(() => td.verify(worker.goIdle()));
	});
});
test('if findTask().execute() does not complete before worker.patience elapses, goIdle is called with timeout Error', t => {
	const execute = td.function();
	const taskFinder = () => wait(100);
	td.when(taskFinder()).thenResolve({ execute });
	td.when(execute()).thenResolve();
	const worker = new Worker(taskFinder, { patience: 50 });
	worker.sleep();
	worker.goIdle = td.function();
	worker.idle = true;
	return worker.heartbeat().then(() => {
		t.notThrows(() =>
			td.verify(worker.goIdle(new Error('Timeout has occured')))
		);
	});
});
