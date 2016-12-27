require('../init');
const {AccountManager, AccountAlreadyExistError} = require('../src/account');

describe('Account', () => {
	it('Creation', (done) => {
		AccountManager.createAccount('test', 'password').then(() => {
			done();
		}).catch((err) => {
			if(err instanceof AccountAlreadyExistError){
				return done();
			}

			done(err);
		});
	});

	it('Compare', (done) => {
		AccountManager.comparePassword('test', 'password').then((res) => {
			if(res) done();
			else done(new Error('password does not match'));
		}).catch(done);
	});
});