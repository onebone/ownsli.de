const express = require('express');
const router = express.Router();

const {DocumentManager} = require('../src/document');

router.get('/get', (req, res) => {
	const owner = req.query.owner;
	const mode = parseInt(req.query.mode || '2'); // SORT_TIME
	const page = parseInt(req.query.page || '1');
	const count = parseInt(req.query.count || '15');

	let query = {};
	if(owner){
		query = {owner: owner};
	}
	DocumentManager.getDocuments(query, mode, page, count).then((documents) => {
		let arr = [];
		documents.forEach((document) => {
			arr.push({
				id: document._id,
				owner: document._owner,
				name: document._name,
				slideCount: document._slides.length,
				lastSave: documents._lastSave
			});
		});

		res.json(arr);
	}).catch((err) => res.send('null'));
});

module.exports = router;
