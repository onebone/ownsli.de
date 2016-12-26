function Workspace(slideRoot, workspaceRoot){
	this.root = slideRoot;
	this.workspaceRoot = workspaceRoot;
	this.initWorkspace();
}

Workspace.prototype.initWorkspace = function(){
	/*this.workspace = document.createElement('main');
	this.workspace.setAttribute('class', 'os-editor-workspace');
	document.body.append(this.workspace);
	//TODO initWorkspace*/
};

Workspace.prototype.addToWorkspace = function(node){
	this.workspaceRoot.append(node);
};

module.exports = Workspace;
