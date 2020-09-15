'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const superagent = require('superagent');

const app = express();
app.use(cors());

let port = process.env.PORT;
let locationAPIKey = process.env.LOCATION_API;
let weatherAPIKey = process.env.WEATHER_API;

app.get('/', (request, response) => {
  response.send('Hello World');
  console.log('hello');
})

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.use('*', notFoundHandler);

function notFoundHandler(request, response){
  response.status(500).send('Sorry, something went wrong');
}

function handleLocation(request, response) {
  try {
    const city = request.query.city;
    const url = `https://us1.locationiq.com/v1/search.php?key=${locationAPIKey}&q=${city}&format=json&limit=1`;
    superagent.get(url)
      .then(data => {
        const locationData = data.body[0];
        let location = new Location(city, locationData);
        response.send(location);
      })
      .catch(() => {
        response.status(500).send('Something went wrong with your location with your superagent location');
        console.log(url);
      })
  }
  catch (error) {
    response.status(500).send('You have done something wrong!');
  }
}

function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}

function handleWeather(request, response) {
  try {
    const lat = request.query.latitude;
    const lon = request.query.longitude;
    const city = request.query.search_query;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&lat=${lat}&lon=${lon}&key=${weatherAPIKey}`
    superagent.get(url)
      .then(results => {
        const weatherData = results.body.data.slice(0, 8);
        response.send(weatherData.map(day => new Weather(day)));
      })
  }
  catch (error) {
    response.status(500).send('You have done something wrong!');
  }
}

function Weather(day) {
  this.forecast = day.weather.description;
  this.time = day.datetime;
}

app.listen(port, () => {
  console.log('Listening on port: ' + port);
});










