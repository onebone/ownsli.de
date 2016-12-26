require('../bin/www');

const assert = require('assert');

const Sync = require('../src/sync');
const {Document} = require('../src/document');
const {Session} = require('../src/session');

describe('Group', () => {
	it('Creation', (done) => {
		Sync.resetGroups();

		const now = Date.now();
		Sync.createGroup(new Document('testId', 'name', []), new Session('test', 'thisisatoken', now), new Session('test2', 'thisisatoken2', now));

		assert.deepEqual({
			'testId': [
				new Session('test', 'thisisatoken', now), new Session('test2', 'thisisatoken2', now)
			]
		}, Sync.getGroups());

		done();
	});

	it('Join', (done) => {
		Sync.resetGroups();

		Sync.createGroup(new Document('testId', 'name', []));

		const now = Date.now();
		Sync.joinSession('testId', new Session('test', 'thisisatoken', now));

		assert.deepEqual({
			'testId': [
				new Session('test', 'thisisatoken', now)
			]
		}, Sync.getGroups());

		done();
	});

	it('Leave', (done) => {
		Sync.resetGroups();

		Sync.createGroup(new Document('testId', 'name', []));

		const now = Date.now();
		Sync.joinSession('testId', new Session('test', 'thisisatoken', now));
		Sync.leaveSession('testId', 'test');

		assert.deepEqual({
			'testId': [

			]
		}, Sync.getGroups());

		done();
	});

	it('Remove', (done) => {
		Sync.resetGroups();

		const now = Date.now();
		Sync.createGroup(new Document('testId', 'name', []), new Session('test', 'thisisatoken', now), new Session('test2', 'thisisatoken2', now));
		Sync.createGroup(new Document('testId2', 'name', []), new Session('test3', 'thisisatoken3', now), new Session('test4', 'thisisatoken4', now));

		Sync.removeGroup('testId2');

		assert.deepEqual({
			'testId': [
				new Session('test', 'thisisatoken', now), new Session('test2', 'thisisatoken2', now)
			]
		}, Sync.getGroups());

		done();
	});
});
