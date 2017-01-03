require('../init');
const {DocumentManager, Document, Slide} = require('../src/document');
const {Vector3, Vector2} = require('../src/math');
const Utils = require('../src/utils');

describe('Document', () => {
	let id;
	it('Creation', (done) => {
		DocumentManager.addDocument('test', 'test').then((created) => {
			id = created;
			done();
		}).catch(done);
	});

	it('Update', (done) => {
		DocumentManager.getDocument(id).then((document) => {
			if(document === null) throw new Error('document does not exist');
			let len = Utils.rand(1, 5);
			document._slides = {};
			for(let i = 0; i < len; i++){
				document.addSlide(new Slide(
					document,
					0,
					new Vector3(Utils.rand(-100, 100), Utils.rand(-100, 100), Utils.rand(-100, 100)), // position
					new Vector2(Utils.rand(-100, 100), Utils.rand(-100, 100)), // size
					new Vector3(Utils.rand(-100, 100), Utils.rand(-100, 100), Utils.rand(-100, 100)), // rotation
					0, // order
					[], // meta
					[]
				));
			}

			DocumentManager.saveDocument(document).then(() => done());
		}).catch(done);
	});

	it('Sort', (done) => {
		DocumentManager.getDocuments({}, DocumentManager.SORT_TIME, 1, 5).then((documents) => {
			let last = Date.now();

			documents.forEach((document) => {
				if(last < document._lastSave){
					done(new Error('invalid sort'));
					return;
				}
				last = document._lastSave;
			});

			done();
		});
	});
});
