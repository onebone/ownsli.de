function Workspace(slideRoot, workspaceRoot){
	this.root = slideRoot;
	this.workspaceRoot = workspaceRoot;
	this.document = {
		slides: []
	};
}

Workspace.prototype.addToWorkspace = function(node){
	this.workspaceRoot.append(node);
};

module.exports = Workspace;
