'use strict';

require('dotenv').config();

const cors = require('cors');
const express = require('express');
const superagent = require('superagent');
const pg = require('pg')

const app = express();
app.use(cors());

let port = process.env.PORT;
const client = new pg.Client(process.env.DATABASE_URL);
let locationAPIKey = process.env.LOCATION_API;
let weatherAPIKey = process.env.WEATHER_API;
let hikingAPIKey = process.env.HIKING_API
let locations = {};

app.get('/', (request, response) => {
  response.send('Hello World');
})

app.get('/location', handleLocation);
app.get('/weather', handleWeather);
app.get('/trails', handleTrails);
app.use('*', notFoundHandler);

function notFoundHandler(request, response){
  response.status(500).send('Sorry, something went wrong');
}


function handleLocation(request, response) {
  const SQL = `SELECT * FROM citydata WHERE search_query = $1;`;
  client.query(SQL, [request.query.city.toLowerCase()])
    .then(results => {
      if (results.rowCount >= 1) {
        console.log('getting results FROM THE DATABASE');
        response.status(200).json(results.rows[0]);
      } else {
        console.log('getting city from API', request.query.city);
        const url = `https://us1.locationiq.com/v1/search.php`;

        let queryObject = {
          key: locationAPIKey,
          city: request.query.city,
          format: 'json',
          limit: 1
        };

        superagent.get(url).query(queryObject)
          .then(data => {
            console.log('you got the data');
            const locationData = data.body[0];
            let location = new Location(queryObject.city, locationData);
            addLocationToDB(location);
            response.send(location);
          })
          .catch(() => {
            response.status(500).send('Something went wrong with your location with your superagent location');
            console.log(url);
          })
      }
    })
}


function Location(city, locationData) {
  this.search_query = city;
  this.formatted_query = locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}

function addLocationToDB(city) {
  let SQL = `INSERT INTO citydata VALUES ($1, $2, $3, $4);`;
  let safeValues = [city.search_query.toLowerCase(), city.formatted_query, city.latitude, city.longitude];

  client.query(SQL, safeValues)
    .then (data => console.log(data + 'was stored'));
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

function handleTrails(request, response) {
  try {
    const lat = request.query.latitude;
    const lon = request.query.longitude;
    const url = `https://www.hikingproject.com/data/get-trails?lat=${lat}&lon=${lon}&maxDistance=10&key=${hikingAPIKey}`
    superagent.get(url)
      .then(results => {
        const hikingData = results.body.trails;
        response.send(hikingData.map(trails => new Trail(trails)));
      })
  }
  catch (error) {
    response.status(500).send('You have done something wrong!');
  }
}

function Trail(trails) {
  this.name = trails.name;
  this.location = trails.location;
  this.length = trails.length;
  this.stars = trails.stars;
  this.star_votes = trails.starVotes;
  this.summary = trails.summary;
  this.trail_url = trails.url
  this.conditions = trails.conditionDetails;
  this.condition_date = trails.conditionDate.slice(0, 9);
  this.condition_time = trails.conditionDate.slice(11, 19);
}

function startServer() {
  app.listen(port, () => {
    console.log('Server is listening on port', port);
  });
}

client.connect()
  .then(startServer)
  .catch(e => console.log(e))










