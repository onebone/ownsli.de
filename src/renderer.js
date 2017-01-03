const escape = require('escape-html');

const renderMorph = (pos, rot, size) =>	{
	const centerX = pos.x + Math.round(size.x / 2);
	const centerY = pos.y + Math.round(size.y / 2);

	let transformBase = `width: ${size.x}px; height: ${size.y}px; transform: rotateX(${rot.x}deg) rotateY(${rot.y}deg) rotateZ(${rot.z}deg) `;
	if(pos.z) transformBase += `translate3d(${pos.x}px, ${pos.y}px, ${pos.z}px)`;
	else transformBase += `translate(${pos.x}px, ${pos.y}px)`;

	transformBase += `; transform-origin: ${centerX}px ${centerY}px`
	return transformBase;
};
const copyProperty = (thisArg, target) => ['id', 'pos', 'rot', 'size', 'type', 'meta', 'shapes'].forEach((v) => thisArg[v] = target[v]);

class ShapeRenderer{
	constructor(shape){
		this.shape = shape;
		copyProperty(this, shape);
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

class RectangleRenderer extends ShapeRenderer{
	constructor(...args){
		super(...args);
	}

	render(){
		const border = (this.meta.type === 'rectangle') ? '0' : '50%';
		return `<div style="${renderMorph(this.pos, this.rot, this.size)}; background: ${this.meta.shape}; border: ${border};"></div>`;
	}
}

class VideoRenderer extends ShapeRenderer{
	constructor(...args){
		super(...args);
	}

	render(){
		const size = `width: ${this.size.x}px; height: ${this.size.y}px`;
		let vnode;

		if(this.meta.type === 'raw') vnode = `<video src=${this.meta.src} style="${size}" controls></video>`
		else vnode = `<iframe
			src="https://www.youtube-nocookie.com/embed/${this.meta.youtube}?rel=0"
			frameborder="0"
			width="640"
			height"360"
			style="pointerEvents: none; ${size}"
			allowfullscreen></iframe>`

		return `<div style="${renderMorph(this.pos, this.rot, this.size)}">${vnode}</div>`;
	}
}

class HTMLRenderer extends ShapeRenderer{
	constructor(...args){
		super(...args);
	}

	render(){
		const random = `${this.id}-${Math.random().toString(36).slice(2)}`;
		return
			`<iframe id="os-iframe-${random}"></iframe>
			<script id="os-html-${random}" type="text/osprescript">
				${escape(this.meta.html)}
			</script>
			<script id="os-css-${random}" type="text/osprescript">
				${escape(this.meta.css)}
			</script>
			<script id="os-js-${random}" type="text/osprescript">
				${escape(this.meta.js)}
			</script>
			<script>
				(function(){
					var $ = document.getElementById.bind(document);
					var iframe = $('os-iframe-${random}');
					var html = $('os-html-${random}');
					var css = $('os-css-${random}');
					var js = $('os-js-${random}');
					this.iframe.contentWindow.document.body.innerHTML =
						html.innerText +
						'<style>' +
						css.innerText +
						'</style>';

					var script = document.createElement('script');
					script.innerHTML = js.innerText;

					this.iframe.contentWindow.document.body.append(script);
				})();
			</script>`
	}
}

const TYPE_TEXT = 0;
const TYPE_RECTANGLE = 1;
const TYPE_IMAGE = 2;
const TYPE_VIDEO = 3;
const TYPE_HTML = 4;

const RENDERER_BY_TYPE = new Map([
	[TYPE_TEXT, TextRenderer],
	[TYPE_RECTANGLE, RectangleRenderer],
	[TYPE_IMAGE, ImageRenderer],
	[TYPE_VIDEO, VideoRenderer],
	[TYPE_HTML, HTMLRenderer]
]);

class SlideRenderer{
	constructor(slide){
		this.slide = slide;
		copyProperty(this, slide);
	}

	render(){
		const shapes = Object
			.keys(this.shapes)
			.map((k) => this.shapes[k])
			.map((v) => (new (RENDERER_BY_TYPE.get(v.type))(v)).render())
			.join('\n');

		return `<div
			id="slide-${this.id}"
			data-x="${this.pos.x}"
			data-y="${this.pos.y}
			data-z="${this.pos.z}"
			data-rotate-x="${this.rot.x}"
			data-rotate-y="${this.rot.y}"
			data-rotate-z="${this.rot.z}"
			class="step"
			style="background: ${this.meta.background || '#fff'}; position: absolute; background-size: cover; background-position: center center; ${renderMorph(this.pos, this.rot, this.size)}">
				${shapes}
			</div>`
	}
}

class DocumentRenderer{
	constructor(document){
		this.title = document.name;
		this.slides = document.slides;
		this.meta = document.meta;
	}

	render(){
		return `<!DOCTYPE html>
		<html>
			<head>
				<title>${this.title}</title>
				<meta charset="utf-8">
			</head>

			<body style="background: ${this.meta.background || '#fff'}; background-size: cover; background-position: center center; width: 100vw; height: 100vh; margin: 0;">
				<div id="impress" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh">
					${Object.keys(this.slides).map((k) => this.slides[k]).map((v) => (new SlideRenderer(v)).render()).join('\n')}
				</div>
				<script src="./impress.js"></script>
				<script>var api = impress(); api.init();</script>
			</body>
		</html>`;
	}
}

module.exports = {
	ShapeRenderer,
	ImageRenderer,
	TextRenderer,
	RectangleRenderer,
	HTMLRenderer,
	SlideRenderer,
	DocumentRenderer
};
