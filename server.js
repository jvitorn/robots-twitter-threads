const express = require('express');
const axios   = require('axios');
const app     = express();
const cors    = require('cors');
const bodyParser 	= require('body-parser'); 
const config  = require('./config');
// axios instance
const instance = axios.create({
    baseURL: 'https://localhost:8080/',
    timeout: 1000,
    headers: {'X-Custom-Header': 'foobar'}
  });
// APP CONFIGURATION ==================
// ====================================
// use body parser so we can grab information from POST requests
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));
// configure our app to handle CORS requests
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, x-access-token, content-type, Authorization');
	next();
});
app.use(cors());
app.use(express.static(__dirname + '/public'));
//defout 8080
app.listen(config.port);

console.log('servidor rodando na porta:' + config.port);