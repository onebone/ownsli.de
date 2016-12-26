function Workspace(slideRoot){
	this.root = slideRoot;
	this.initWorkspace();
}

Workspace.prototype.initWorkspace = function(){
	this.workspace = document.createElement('main');
	this.workspace.setAttribute('class', 'os-editor-workspace');
	document.body.append(this.workspace);
	//TODO initWorkspace
};

module.exports = Workspace;
