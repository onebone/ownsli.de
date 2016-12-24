'use strict';

class Vector2{
	constructor(x, y){
		this._x = x;
		this._y = y;
	}

	add(x = 0, y = 0){
		return new Vector2(this._x + x, this._y + y);
	}

	getX(){
		return this._x;
	}

	getY(){
		return this._y;
	}

	getFloorX(){
		return Math.floor(this._x);
	}

	getFloorY(){
		return Math.floor(this._y);
	}

	distance(vec){
		vec = vec || new Vector2(0, 0);
		return Math.hypot(this._x - vec.x, this._y - vec.y);
	}
}

module.exports = {Vector2};