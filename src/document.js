'use strict';
//TODO update jsdoc, api

const MongoConnection = require('./mongo');
const Utils = require('./utils');
const {Vector3, Vector2} = require('./math');

// Document is wrapper of a presentation
class Document{
	/**
	 * @param {string} id           | Id of document
	 * @param {string} owner        | User Id of owner
	 * @param {string} name         | Name of document
	 * @param {object} slides       | Key of the array is page
	 * @param {string[]} invitation | Invited user id
	 * @param {int} lastSave        | Timestamp of last saved
	 */
	constructor(id, owner, name, slides = {}, invitation = [], lastSave = Date.now()){
		this._id = id;
		this._owner = owner;
		this._name = name;
		this._slides = {};

		Object.keys(slides).forEach((index) => {
			const data = slides[index];
			if(data instanceof Slide){
				this._slides[index] = data;
			}else{
				slides[index].vec = slides[index].vec || new Vector3();
				slides[index].size = slides[index].size || new Vector2();
				slides[index].rot = slides[index].rot || new Vector3();

				this._slides[index] = new Slide(
					parseInt(index),
					new Vector3(slides[index].vec.x, slides[index].vec.y, slides[index].vec.z),
					new Vector2(slides[index].size.x, slides[index].size.y),
					new Vector3(slides[index].rot.x, slides[index].rot.y, slides[index].rot.z),
					slides[index].order,
					slides[index].meta,
					slides[index].shapes
				);
			}
		});

		this._invitation = invitation;
		this._lastSave = lastSave;
	}

	/**
	 * @return {string}
	 */
	getId(){
		return this._id;
	}

	getOwner(){
		return this._owner;
	}

	/**
	 * @return {string}
	 */
	getName(){
		return this._name;
	}

	/**
	 * @return {Object}
	 */
	getSlides(){
		return this._slides;
	}

	/**
	 * @param {int} id
	 * @return {Slide}
	 */
	getSlide(id){
		return this._slides[id];
	}

	/**
	 * @param {Slide} slide
	 * @return {int}
	 */
	addSlide(slide){
		if(!slide) return -1;

		this._slides[slideId] = slide;
		return slideId++;
	}

	/**
	 * @return {int}
	 */
	getSlideCount(){
		return this._slides.length;
	}

	/**
	 * @param {string} userId
	 */
	addInvitation(userId){
		this._invitation.push(userId);
	}

	/**
	 * @param {string} userId
	 */
	removeInvitation(userId){
		let index;
		if((index = this._invitation.indexOf(userId)) !== -1){
			this._invitation.splice(index, 1);

			return true;
		}
		return false;
	}

	/**
	 * @return {string[]}
	 */
	getInvitations(){
		return this._invitation;
	}

	/**
	 * @return {int}
	 */
	getLastSave(){
		return this._lastSave;
	}

	toArray(){
		let data = {
			id: this._id,
			owner: this._owner,
			name: this._name,
			slides: {},
			invitation: this._invitation,
			lastSave: this._lastSave
		};

		Object.keys(this._slides).forEach((index) => {
			const slide = this._slides[index];
			let shapesArr = [];

			const shapes = slide.getShapes();
			Object.keys(shapes).forEach((index) => {
				const shape = shapes[index];
				shapesArr.push(shape.toArray());
			});

			const pos = slide.getPosition();
			const rot = slide.getRotation();
			const size = slide.getSize();

			data.slides[slide.getId()] = {
				id: slide.getId(),
				pos: [pos.getX(), pos.getY(), pos.getZ()],
				rot: [rot.getX(), rot.getY(), rot.getZ()],
				size: [size.getX(), size.getY()],
				order: slide.getOrder(),
				meta: slide.getMetadata(),
				shapes: shapesArr
			};
		});

		return data;
	}
}

let slideId = 1;
// Slide is a wrapper of slide which is included in Document
class Slide{
	/**
	 * @param {int} id           | id of slide
	 * @param {Vector3} vec         | Position of slide where slide will be placed
	 * @param {Vector2} size        | Size of slide
	 * @param {Vector3} rotation    | Rotation of slide
	 * @param {int} order           | Order of slide
	 * @param {object} meta         | Metadata of slide
	 * @param {object} shapes       | Shapes which is included in slide
	 */
	constructor(id, vec, size, rotation, order, meta, shapes){
		this._id = id || slideId++;
		if(this._id >= slideId){
			slideId = this._id + 1;
		}

		this._vec = vec;
		this._size = size;
		this._rotation = rotation;
		this._order = order;
		this._meta = meta;

		this._shapes = {};
		Object.keys(shapes).forEach((index) => {
			const data = shapes[index];
			if(data instanceof Slide){
				this._shapes[index] = data;
			}else{
				shapes[index].vec = shapes[index].vec || new Vector3();
				shapes[index].size = shapes[index].size || new Vector2();
				shapes[index].rot = shapes[index].rot || new Vector3();

				this._shapes[index] = new Shape(
					index,
					new Vector2(shapes[index].vec.x, shapes[index].vec.y),
					new Vector2(shapes[index].size.x, shapes[index].pos.y),
					new Vector3(shapes[index].rot.x, shapes[index].rot.y, shapes[index].rot.z),
					shapes[index].type,
					shapes[index].meta
				);
			}
		});
	}

	/**
	 * @return int
	 */
	getId(){
		return this._id;
	}

	/**
	 * @return {Vector3}
	 */
	getPosition(){
		return this._vec.add();
	}

	/**
	 * @param {Vector3} vec
	 */
	setPosition(vec){
		this._vec = vec.add();
	}

	/**
	 * @return {Vector3}
	 */
	getRotation(){
		return this._rotation.add();
	}

	/**
	 * @param {Vector3} rot
	 */
	setRotation(rot){
		this._rotation = rot.add();
	}

	/**
	 * @return {Vector2}
	 */
	getSize(){
		return this._size.add();
	}

	/**
	 * @param {Vector2} vec
	 */
	setSize(vec){
		this._size = vec.add();
	}

	/**
	 * @return {int}
	 */
	getOrder(){
		return this._order;
	}

	/**
	 * @param {int} order
	 */
	setOrder(order){
		this._order = order;
	}

	/**
	 * @return {Object}
	 */
	getMetadata(){
		return this._meta;
	}

	/**
	 * @param {Object} meta
	 */
	setMetadata(meta){
		this._meta = meta;
	}

	addShape(shape){
		if(!shape) return -1;
		if(shape._id === -1) shape._id = shapeId;

		this._shapes[shapeId] = shape;
		return shapeId++;
	}

	/**
	 * @param {int} id
	 * @return {Shape}
	 */
	getShape(id){
		return this._shapes[id];
	}

	/**
	 * @return {Object}
	 */
	getShapes(){
		return this._shapes;
	}
}

let shapeId = 0;
// Shape is an object which is placed on slide
class Shape{
	/**
	 * @param {int} id             | Id of shape
	 * @param {Vector2} vec	        | Position of shape where an object will be placed
	 * @param {Vector3} rotation   | Rotation of shape
	 * @param {Vector2} size       | Size of shape
	 * @param {int} type	        | Type of shape
	 * @param {Object} meta	        | Other data needed to render shape
	 */
	constructor(id, vec, rotation, size, type, meta){
		this._id = id;
		this._id = id || shapeId++;
		if(this._id >= shapeId){
			shapeId = this._id + 1;
		}

		this._vec = vec;
		this._rotation = rotation;
		this._size = size;
		this._type = type;
		this._meta = meta;
	}

	/**
	 * @return {int}
	 */
	getId(){
		return this._id;
	}

	/**
	 * @param {Vector2} vec
	 */
	setPosition(vec){
		this._vec = vec.add();
	}

	/**
	 * @return {Vector2}
	 */
	getPosition(){
		return this._vec.add();
	}

	/**
	 * @return {int}
	 */
	getType(){
		return this._type;
	}

	/**
	 * @return {Object}
	 */
	getMetadata(){
		return this._meta;
	}

	/**
	 * @param {Object} meta
	 */
	setMetadata(meta){
		this._meta = meta;
	}

	/**
	 * @return {Vector3}
	 */
	getRotation(){
		return this._rotation.add();
	}

	/**
	 * @param {Vector3} rot
	 */
	setRotation(rot){
		this._rotation = rot.add();
	}

	/**
	 * @return {Vector2}
	 */
	getSize(){
		return this._size;
	}

	/**
	 * @param {Vector2} size
	 */
	setSize(size){
		this._size = size;
	}

	toArray(){
		return {
			shape: this._id,
			pos: [this._vec.x, this._vec.y],
			size: [this._size.x, this._size.y],
			rot: [this._rotation.x, this._rotation.y, this._rotation.z],
			type: this._type,
			meta: this._meta
		};
	}
}

class DocumentManager{
	/**
	 * Creates one document
	 *
	 * @param {string} owner
	 * @param {string} name
	 * @return {Promise}
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
	 * @param {string} id
	 */
	static getDocument(id){
		return new Promise((resolve, reject) => {
			MongoConnection.query('document', {
				id: id
			}).toArray((err, rows) => {
				if(err) return reject(err);
				if(rows.length < 1) return resolve(null);

				resolve(new Document(rows[0].id, rows[0].owner, rows[0].name, rows[0].slides, rows[0].invitation, rows[0].lastSave));
			});
		});
	}

	/**
	 * @param {Document} document
	 */
	static saveDocument(document){
		document._lastSave = Date.now();
		return MongoConnection.replace('document', {
			id: document.getId()
		}, document.toArray());
	}

	/**
	 * @param {Object} query
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
					mode === DocumentManager.SORT_NAME ? {name: 1}
					: mode === DocumentManager.SORT_TIME ? {lastSave: -1}
					: mode === DocumentManager.SORT_OWNER ? {owner: 1}
					: mode === DocumentManager.SORT_NAME_DESC ? {name: -1}
					: mode === DocumentManager.SORT_TIME_DESC ? {lastSave: 1}
					: mode === DocumentManager.SORT_OWNER_DESC ? {owner: -1}
					: {name: -1}
				).skip((page - 1) * count).limit(count).toArray((err, documents) => {
					if(err) return reject(err);
					let data = [];
					documents.forEach((document) => {
						data.push(new Document(document.id, document.owner, document.name, document.slides, document.invitation, document.lastSave));
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
DocumentManager.SORT_OWNER = 4;
DocumentManager.SORT_NAME_DESC = 9;
DocumentManager.SORT_TIME_DESC = 10;
DocumentManager.SORT_OWNER_DESC = 12;

module.exports = {DocumentManager, Document, Slide, Shape};
