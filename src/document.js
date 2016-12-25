'use strict';

const MongoConnection = require('./mongo');
const Utils = require('./utils');

// Document is wrapper of a presentation
class Document{
	/**
	 * @param id string         | Id of document
	 * @param name string       | Name of document
	 * @param slides Slide[]    | Key of the array is page
	 */
	constructor(id, name, slides = []){
		this._id = id;
		this._name = name;
		this._slides = slides;
	}

	/**
	 * @returns string
	 */
	getId(){
		return this._id;
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
			name: this._name,
			slides: []
		};

		this._slides.forEach((slide) => {
			let shapes = [];
			slide.getShapes().forEach((shape) => {
				shapes.push(shape.toArray());
			});

			data.slides.push({ // slide info
				vec: [slide.getPosition().getX(), slide.getPosition().getY()],
				shapes: shapes
			});
		});

		return data;
	}
}

// Slide is a wrapper of slide which is included in Document
class Slide{
	/**
	 * @param vec Vector2       | Position of slide where slide will be placed
	 * @param shapes Shape[]    | Shapes which is included in slide
	 */
	constructor(vec, shapes){
		this._vec = vec;
		this._shapes = shapes;
	}

	/**
	 * @return Vector2
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
	 * @param name string
	 * @return Promise
	 */
	static addDocument(name){
		return MongoConnection.insert('document', {
			id: Utils.createToken(32), // TODO Check if same id exist
			name: name,
			slides: []
		});
	}

	/**
	 * @param name string
	 */
	static getDocument(name){
		return new Promise((resolve, reject) => {
			MongoConnection.query('document', {
				name: name
			}, true).toArray((err, rows) => {
				if(err) return reject(err);
				if(rows.length < 1) return resolve(null);

				resolve(new Document(rows[0].id, rows[0].name, rows[0].slides));
			});
		});
	}

	/**
	 * @param document Document
	 */
	static saveDocument(document){
		return MongoConnection.replace('document', {
			id: document.getId()
		}, document.toArray());
	}
}

module.exports = {DocumentManager, Document, Slide, Shape};