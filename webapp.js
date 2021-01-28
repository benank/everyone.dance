const express = require('express');

const app = express();
app.use(express.static('src'));
// Yes, this serves all the source code.
// No, I am not going to fix this right now.
// The issue is allowing the index.html to load the compiled script on both electron and in the served webapp.
// Might look into it more later.

const https = require('https');
const fs = require('fs');

const secureServer = https.createServer({
    key: fs.readFileSync('./../server.key'),
    cert: fs.readFileSync('./../server.cert')
}, app);

const port = 443;
secureServer.listen(port, () => console.log(`Webapp listening on port ${port}..`));