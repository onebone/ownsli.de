'use strict';

const {Vector2} = require('./math');
const {MongoConnection} = require('./mongo');

// Document is wrapper of a presentation
class Document{
	/**
	 * @param slides Slide[] | Key of the array is page
	 */
	constructor(slides = []){
		this._slides = slides;
	}

	/**
	 * @returns Slide[]
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

	getPosition(){
		return this._vec.add();
	}

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
		return this._vec;
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

const documents = new Map();
class DocumentManager{
	/**
	 * Creates one document
	 *
	 * @param name string
	 * @return Promise
	 */
	static addDocument(name){
		return MongoConnection.insert('document', {
			name: name,
			document: {}
		});
	}

	static saveDocument(document){
		// TODO update document
		// document.toArray() should be the value of 'document' key
	}
}

module.exports = {DocumentManager, Document, Slide, Shape};