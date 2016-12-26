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

class Vector3{
	constructor(x = 0, y = 0, z = 0){
		this.x = x;
		this.y = y;
		this.z = z;
	}

	add(x = 0, y = 0, z = 0){
		return new Vector3(this.x + x, this.y + y, this.z + z);
	}

	getX(){
		return this.x;
	}

	getY(){
		return this.y;
	}

	getZ(){
		return this.z;
	}

	getFloorX(){
		return Math.floor(this.x);
	}

	getFloorY(){
		return Math.floor(this.y);
	}

	getFloorZ(){
		return Math.floor(this.z);
	}

	/**
	 * @param vec Vector3
	 * @return number
	 */
	distance(vec){
		vec = vec || new Vector3();
		return Math.hypot(this.x - vec.x, this.y - vec.y, this.z - vec.z);
	}
}

module.exports = {Vector2, Vector3};
