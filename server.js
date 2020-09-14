'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');

const app = express();
app.use(cors);

let port = process.env.PORT;

app.listen(port, () => {
  console.log('Listening on port: ' + port);
});


