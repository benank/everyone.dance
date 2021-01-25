const express = require('express');

const app = express();
app.use(express.static('src'));

const https = require('https');
const fs = require('fs');

const secureServer = https.createServer({
    key: fs.readFileSync('./../server.key'),
    cert: fs.readFileSync('./../server.cert')
}, app);

const port = 443;
secureServer.listen(port, () => console.log(`Webapp listening on port ${port}..`));