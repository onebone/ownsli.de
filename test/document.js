require('../init');
const {DocumentManager, Slide} = require('../src/document');
const {Vector2} = require('../src/math');
const Utils = require('../src/utils');

describe('Document', () => {
	it('Creation', (done) => {
		DocumentManager.addDocument('test').then(() => {
			done();
		});
	});

	it('Update', (done) => {
		DocumentManager.getDocument('test').then((document) => {
			if(document === null) throw new Error('document does not exist');
			let len = Utils.rand(1, 5);
			document._slides = [];
			for(let i = 0; i < len; i++){
				document._slides.push(new Slide(new Vector2(Utils.rand(-100, 100), Utils.rand(-100, 100)), []));
			}

			DocumentManager.saveDocument(document).then(() => done());
		})
	});
});
