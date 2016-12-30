function Workspace(slideRoot, workspaceRoot){
	this.root = slideRoot;
	this.workspaceRoot = workspaceRoot;
	this.document = {
		slides: []
	};

	Sortable.create($('#os-editor-slidelist'), {
		onUpdate: function(evt){
			//TODO socket emit swap order
		}
	});
}

Workspace.prototype.addToWorkspace = function(node){
	this.workspaceRoot.append(node);
};

module.exports = Workspace;
