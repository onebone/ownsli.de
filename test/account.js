require('../init');
const {AccountManager} = require('../src/account');

describe('Account', () => {
	it('Creation', (done) => {
		AccountManager.createAccount('test', 'password').then(() => {
			done();
		});
	});

	it('Compare', (done) => {
		AccountManager.comparePassword('test', 'password').then((res) => {
			if(res) done();
			else throw new Error('password does not match');
		});
	});
});