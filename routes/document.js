const express = require('express');
const router = express.Router();

const {DocumentManager} = require('../src/document');
const {SessionManager} = require('../src/session');
const Sync = require('../src/sync');

router.get('/get', (req, res) => {
	if(!req.session.token) return res.send('null');

	const session = SessionManager.getSession(req.session.token);
	let owner;
	if(session !== null){
		owner = session.getUserId();
	}else return res.send('null');

	const mode = parseInt(req.query.mode || '2'); // SORT_TIME
	const page = parseInt(req.query.page || '1');
	const count = parseInt(req.query.count || '15');

	DocumentManager.getDocuments({
		$or: [{owner: owner},
			{invitation: {$in: [owner]}}]
	}, mode, page, count).then((documents) => {
		let arr = [];
		documents.forEach((document) => {
			arr.push({
				id: document._id,
				owner: document._owner,
				name: document._name,
				slideCount: document._slides.length,
				lastSave: document._lastSave
			});
		});

		res.json(arr);
	}).catch((err) => res.send('null'));
});

router.get('/invite', (req, res) => {
	if(!req.session.token) return res.send('null');

	const session = SessionManager.getSession(req.session.token);

	const username = req.query.username;
	if(typeof username !== 'string') return;

	if(session.getGroup() !== null){
		const group = Sync.getGroup(session.getGroup());
		if(group){
			group.getDocument().addInvitation(username);
			res.json({
				status: true,
				error: false
			})
		}else{
			res.json({
				status: true,
				error: true
			})
		}
	}else return res.json({
		status: true,
		error: true
	});
});

module.exports = router;
