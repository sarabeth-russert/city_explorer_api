'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const locationData = require('./data/location.json');
const weatherData = require('./data/weather.json');

const app = express();
app.use(cors());

let port = process.env.PORT;

app.get('/', (request, response) => {
  response.send('Hello World');
  console.log('hello');
})

app.get('/location', handleLocation);

function handleLocation(request, response){
  try {
    const city = request.query.city;
    const locationObject = new Location(city, locationData);
    response.send(locationObject);
  }
  catch (error) {
    response.status(500).send('You have done something wrong!');
  }
}

function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}





app.listen(port, () => {
  console.log('Listening on port: ' + port);
});




