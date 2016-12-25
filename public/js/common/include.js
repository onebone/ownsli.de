//webpack과 같이 패키징할 때 생기는 귀차니즘으로부터...
window.include = function(srclist, cb){
	var requireModule = (function(index){
		var moduleName = Object.keys(srclist)[index];
		var src = srclist[moduleName];
		var xhr = new XMLHttpRequest();
		xhr.open('GET', src, true);
		xhr.onreadystatechange = function(){
			if(xhr.readyState !== 4) return;

			if(xhr.status === 200){
				//모듈 변수 설정
				var module = {
					_exports: {}
				};

				Object.defineProperty(module, 'exports', {
					get: (function(){
						return this._exports;
					}).bind(module),

					set: (function(v){
						this._exports = v;
					}).bind(module)
				});

				//XHR로 받아온 결과물 eval
				try{
					(new Function('module', 'exports', xhr.responseText))(module, module.exports);
				}catch(err){
					cb(err);
					return;
				}

				//exports를 global에 모듈명으로 저장
				window[moduleName] = module.exports;

				//마지막까지 갈 경우 끝냄
				if(Object.keys(srclist).length <= index + 1){
					cb(null);
				}else{
					setTimeout(function(){
						requireModule(index + 1);
					}, 0);
				}
			}else{
				cb(new Error('Error while requesting module from server (Status ' + xhr.status + ') : ' + moduleName));
			}
		};
		xhr.send(null);
	});

	requireModule(0);
};
