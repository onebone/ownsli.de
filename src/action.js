'use strict';

const buildRedo = (type, data) => {
	switch(type){
		case 'create shape':
			return {
				type: 'delete shape',
				data: data // data: shape id
			};
		case 'delete shape':
			return {
				type: 'create shape',
				data: data // data: {Shape}
			};
		case 'update shape':
			return {
				type: 'update shape',
				data: data
			};
	}
};

class Action{
	constructor(slide, type, data){
		const revert = buildRedo(type, data);
		this._slide = slide;
		this._type = revert.type;
		this._data = revert.data;
	}

	/**
	 * @return {string}
	 */
	getSlide(){
		return this._slide;
	}

	/**
	 * @return {string}
	 */
	getType(){
		return this._type;
	}

	/**
	 * @return {Object}
	 */
	getData(){
		return this._data;
	}
}

module.exports = Action;