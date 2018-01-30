'use strict';

const test = require('ava').test;
const singleton = require('./singleton');

test('is singleton', t => {
	const foo = singleton.getInstance(() => wait(50));
	const bar = singleton.getInstance();
	t.deepEqual(foo, bar);
});
