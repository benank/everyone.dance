const express = require('express');

const app = express();
app.use(express.static('src'));
 
const port = process.env.PORT || 80;
app.listen(port, () => console.log(`Webapp listening on port ${port}..`));