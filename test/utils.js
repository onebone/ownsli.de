const Utils = require('../src/utils');

describe('Utils', () => {
	it('Encryption', (done) => {
		Utils.encrypt('password').then((data) => {
			Utils.compareHash('password', data).then((res) => {
				if(res) return done();
				throw new Error('password does not match');
			});
		});
	});

	it('Random', (done) => {
		for(let i = 0; i < 100000; i++){
			let rand = Utils.rand(100, 1000);
			if(rand < 100 || rand > 1000){
				throw new Error('random returned out of range');
			}
		}
		done();
	});
});