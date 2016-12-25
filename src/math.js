'use strict';

class Vector2{
	constructor(x, y){
		this.x = x;
		this.y = y;
	}

	add(x = 0, y = 0){
		return new Vector2(this.x + x, this.y + y);
	}

	getX(){
		return this.x;
	}

	getY(){
		return this.y;
	}

	getFloorX(){
		return Math.floor(this.x);
	}

	getFloorY(){
		return Math.floor(this.y);
	}

	distance(vec){
		vec = vec || new Vector2(0, 0);
		return Math.hypot(this.x - vec.x, this.y - vec.y);
	}
}

module.exports = {Vector2};