require('../app');

const assert = require('assert');

const Sync = require('../src/sync');
const {Document} = require('../src/document');
const {Session} = require('../src/session');

describe('Group', () => {
	it('Creation', (done) => {
		Sync.resetGroups();

		const now = Date.now();
		Sync.createGroup(new Document('testId', 'name', []), new Session('test', 'thisisatoken', now), new Session('test2', 'thisisatoken2', now));

		const sess1 = new Session('test', 'thisisatoken', now), sess2 =  new Session('test2', 'thisisatoken2', now);
		sess1._group = sess2._group = 'testId';
		assert.deepEqual({
			'testId': [
				sess1, sess2
			]
		}, Sync.getGroups());

		done();
	});

	it('Join', (done) => {
		Sync.resetGroups();

		Sync.createGroup(new Document('testId', 'name', []));

		const now = Date.now();
		const session = new Session('test', 'thisisatoken', now);
		Sync.joinSession('testId', session);

		const session2 = new Session('test', 'thisisatoken', now);
		session2._group = 'testId';
		assert.deepEqual({
			'testId': [
				session2
			]
		}, Sync.getGroups());

		done();
	});

	it('Leave', (done) => {
		Sync.resetGroups();

		Sync.createGroup(new Document('testId', 'name', []));

		const now = Date.now();
		const session = new Session('test', 'thisisatoken', now);
		Sync.joinSession('testId', session);
		Sync.leaveSession(session);

		assert.deepEqual({
			'testId': [

			]
		}, Sync.getGroups());

		done();
	});

	it('Remove', (done) => {
		Sync.resetGroups();

		const now = Date.now();

		let sessions = [];
		for(let i = 0; i < 4; i++){
			sessions[i] = new Session('test'+i, 'thisisatoken'+i, now);
		}

		Sync.createGroup(new Document('testId', 'name', []), sessions[0], sessions[1]);
		Sync.createGroup(new Document('testId2', 'name', []), sessions[2], sessions[3]);

		Sync.removeGroup('testId2');

		const sess1 = new Session('test0', 'thisisatoken0', now);
		const sess2 = new Session('test1', 'thisisatoken1', now);
		sess1._group = sess2._group = 'testId';
		assert.deepEqual({
			'testId': [
				sess1, sess2
			]
		}, Sync.getGroups());

		done();
	});
});
