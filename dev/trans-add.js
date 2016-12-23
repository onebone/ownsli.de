const currTranslation = require('./translation-todo.json');
const addTranslation = process.argv[2];
currTranslation.push(addTranslation);

require('fs').writeFileSync(require('path').join(__dirname, 'translation-todo.json'), JSON.stringify(currTranslation));
