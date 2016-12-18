const fs = require('fs');

global.config = JSON.parse(fs.readFileSync('config.json'));

require('./src/mongo');