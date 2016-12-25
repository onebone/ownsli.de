function Workspace(slideRoot){
	this.root = slideRoot;
}

Workspace.prototype.initWorkspace = function(){
	this.workspace = document.createElement('main');
	this.workspace.setAttribute('class', 'os-editor-workspace');
	//TODO initWorkspace
};

module.exports = Workspace;
