const chalk = require('chalk');
const fs = require('fs');
const utils = require('./src/utils');

if(!fs.existsSync('config.json')){
	const defaultConfig = JSON.parse(fs.readFileSync('./resources/config.json'));
	defaultConfig.sessionKey = utils.createToken();
	fs.writeFileSync('config.json', JSON.stringify(defaultConfig, null, '\t'));
}
global.config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
global.devmode = process.env.NODE_ENV !== 'production';
global.userCreationToken = Math.random().toString(36).toUpperCase().slice(2, 8);
console.log(chalk.cyan('User Creation Token : ' + userCreationToken));

require('./src/mongo');
