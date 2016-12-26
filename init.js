const fs = require('fs');

global.config = JSON.parse(fs.readFileSync('config.json'));
global.devmode = process.env.NODE_ENV !== 'production';

require('./src/mongo');
