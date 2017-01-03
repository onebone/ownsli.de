const renderMorph = (pos, rot, size) =>	{
	let transformBase = `width: ${size.x}px; height: ${size.y}px; transform: rotateX(${rot.x}deg) rotateY(${rot.y}deg) rotateZ(${rot.z}deg) `;
	if(pos.z) transformBase += `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)`;
	else transformBase += `translate(${pos.x}px, ${pos.y}px)`;

	return transformBase;
};

const TYPE_TEXT = 0;
const TYPE_RECTANGLE = 1;
const TYPE_IMAGE = 2;
const TYPE_VIDEO = 3;
const TYPE_HTML = 4;

class SlideRenderer{

}

class ShapeRenderer{
	constructor(shape){
		this.shape = shape;
		['id', 'pos', 'rot', 'size', 'type', 'meta'].forEach((v) => {
			this[v] = shape[v];
		});
	}

	render(){
		throw new Error('Unsupported Operation');
	}
}

class ImageRenderer extends ShapeRenderer{
	constructor(...args){
		super(...args);
	}

	render(){
		return `<img src="${this.meta.src}" style="${renderMorph(this.pos, this.rot, this.size)}">`;
	}
}

class TextRenderer extends ShapeRenderer{
	constructor(...args){
		super(...args);
	}

	render(){
		return `<p style="${renderMorph(this.pos, this.rot, this.size)}">${this.meta.html}</p>`;
	}
}

module.exports = {ShapeRenderer, ImageRenderer, TextRenderer};
