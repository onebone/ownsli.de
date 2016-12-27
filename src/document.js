'use strict';

const MongoConnection = require('./mongo');
const Utils = require('./utils');

// Document is wrapper of a presentation
class Document{
	/**
	 * @param id string         | Id of document
	 * @param owner string      | User Id of owner
	 * @param name string       | Name of document
	 * @param slides Slide[]    | Key of the array is page
	 * @param lastSave int      | Last saved
	 */
	constructor(id, owner, name, slides = [], lastSave = Date.now()){
		this._id = id;
		this._owner = owner;
		this._name = name;
		this._slides = slides;
		this._lastSave = lastSave;
	}

	/**
	 * @returns string
	 */
	getId(){
		return this._id;
	}

	getOwner(){
		return this._owner;
	}

	/**
	 * @return string
	 */
	getName(){
		return this._name;
	}

	/**
	 * @return Slide[]
	 */
	getSlides(){
		return this._slides;
	}

	/**
	 * @param page int
	 * @return Slide
	 */
	getSlide(page){
		return this._slides[page];
	}

	/**
	 * @return int
	 */
	getPages(){
		return this._slides.length;
	}

	toArray(){
		let data = {
			id: this._id,
			owner: this._owner,
			name: this._name,
			slides: [],
			lastSave: this._lastSave,
		};

		this._slides.forEach((slide) => {
			let shapes = [];
			slide.getShapes().forEach((shape) => {
				shapes.push(shape.toArray());
			});

			data.slides.push({ // slide info
				vec: [slide.getPosition().getX(), slide.getPosition().getY(), slide.getPosition().getZ()],
				shapes: shapes
			});
		});

		return data;
	}
}

// Slide is a wrapper of slide which is included in Document
class Slide{
	/**
	 * @param vec Vector3       | Position of slide where slide will be placed
	 * @param shapes Shape[]    | Shapes which is included in slide
	 */
	constructor(vec, shapes){
		this._vec = vec;
		this._shapes = shapes;
	}

	/**
	 * @return Vector3
	 */
	getPosition(){
		return this._vec.add();
	}

	/**
	 * @return Shape[]
	 */
	getShapes(){
		return this._shapes;
	}
}

// Shape is an object which is placed on slide
class Shape{
	/**
	 * @param vec Vector2   | Position of shape where an object will be placed
	 * @param type int      | Type of shape
	 * @param meta array    | Other data needed to render shape
	 */
	constructor(vec, type, meta){
		this._vec = vec;
		this._type = type;
		this._meta = meta;
	}

	/**
	 * @return Vector2
	 */
	getPosition(){
		return this._vec.add();
	}

	/**
	 * @return int
	 */
	getType(){
		return this._type;
	}

	/**
	 * @return array
	 */
	getMetadata(){
		return this._meta;
	}

	toArray(){
		return {
			vec: [this._vec.x, this._vec.y],
			type: this._type,
			meta: this._meta
		};
	}
}

class DocumentManager{
	/**
	 * Creates one document
	 *
	 * @param owner string
	 * @param name string
	 * @return Promise
	 */
	static addDocument(owner, name){
		return new Promise((resolve, reject) =>{
			const id = Utils.createToken(32); // TODO Check if same id exist
			MongoConnection.insert('document', {
				id: id,
				name: name,
				owner: owner,
				slides: [],
				lastSave: Date.now()
			}).catch(err => reject(err)).then(() => resolve(id));
		});
	}

	/**
	 * @param id string
	 */
	static getDocument(id){
		return new Promise((resolve, reject) => {
			MongoConnection.query('document', {
				id: id
			}).toArray((err, rows) => {
				if(err) return reject(err);
				if(rows.length < 1) return resolve(null);

				resolve(new Document(rows[0].id, rows[0].owner, rows[0].name, rows[0].slides, rows[0].lastSave));
			});
		});
	}

	/**
	 * @param document Document
	 */
	static saveDocument(document){
		document._lastSave = Date.now();
		return MongoConnection.replace('document', {
			id: document.getId()
		}, document.toArray());
	}

	/**
	 * @param query
	 * @param {int} mode
	 * @param {int} page
	 * @param {int} count
	 *
	 * @return Promise
	 */
	static getDocuments(query, mode = DocumentManager.SORT_TIME, page = 1, count = 15){
		page = Math.max(1, page);
		count = Math.max(1, count);

		return new Promise((resolve, reject) => {
			try{
				MongoConnection.query('document', query, false).sort(
					mode === DocumentManager.SORT_NAME ? {name: -1}
					: mode === DocumentManager.SORT_TIME ? {lastSave: -1}
					: mode === DocumentManager.SORT_OWNER ? {owner: -1}
					: mode === DocumentManager.SORT_NAME_DESC ? {name: 1}
					: mode === DocumentManager.SORT_TIME_DESC ? {lastSave: 1}
					: mode === DocumentManager.SORT_OWNER_DESC ? {owner: 1}
					: {name: -1}
				).skip((page - 1) * count).limit(count).toArray((err, documents) => {
					if(err) return reject(err);
					let data = [];
					documents.forEach((document) => {
						data.push(new Document(document.id, document.owner, document.name, document.slides, document.lastSave));
					});

					resolve(data);
				});
			}catch(e){
				reject(e);
			}
		});
	}
}

DocumentManager.SORT_NAME = 1;
DocumentManager.SORT_TIME = 2;
DocumentManager.SORT_OWNER = 3;
DocumentManager.SORT_NAME_DESC = 9;
DocumentManager.SORT_TIME_DESC = 10;
DocumentManager.SORT_OWNER_DESC = 12;

module.exports = {DocumentManager, Document, Slide, Shape};
