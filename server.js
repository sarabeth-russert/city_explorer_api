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
            location.addLocationToDB();
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

Location.prototype.addLocationToDB = function() {
  let SQL = `INSERT INTO citydata (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);`;
  let safeValues = [this.search_query.toLowerCase(), this.formatted_query, this.latitude, this.longitude];

  client.query(SQL, safeValues)
    .then (data => console.log(data + 'was stored'));
}


function handleWeather(request, response) {
  let searchCity = request.query.search_query;
  let todaysDate = new Date().toLocaleDateString();
  let SQL = `SELECT * FROM weatherdata WHERE search_query = $1;`;
  client.query(SQL, [searchCity.toLowerCase()])
    .then(results => {
      if(results.rowCount > 0 && Date.parse(todaysDate) - Date.parse(results.rows[0].time) < 864) {
        console.log('we win');
        response.status(200).json(results.rows);
      } else {
        console.log('its old');
        const url = `https://api.weatherbit.io/v2.0/forecast/daily`;
        let queryObject = {
          key : weatherAPIKey,
          city : searchCity,
          lat : request.query.latitude,
          lon : request.query.longitude
        };
        superagent.get(url).query(queryObject)
          .then(results => {
            const weatherData = results.body.data.slice(0, 8);
            let weatherObjectArray = weatherData.map(day => new Weather(day, searchCity));
            response.status(200).send(weatherObjectArray);
            weatherObjectArray.forEach(day => addWeatherToDb(day));
          })
          .catch(() => {
            response.status(500).send('Something went wrong with your location with your superagent location');
            console.log(url);
          })
      }
    })
}






function formatTime(badTime) {
  let betterTime = badTime.split('-');
  let month = betterTime[1];
  if (betterTime[1][0] === '0') {
    let month =  betterTime[1].slice(1, 2);
    return `${month}/${betterTime[2]}/${betterTime[0]}`
  } else {
    return `${month}/${betterTime[2]}/${betterTime[0]}`;
  }
}

function Weather(day, city) {
  this.search_query = city;
  this.forecast = day.weather.description;
  this.time = formatTime(day.datetime);
}

function addWeatherToDb(day) {
  let SQL = `INSERT INTO weatherdata (search_query, forecast, time) VALUES ($1, $2, $3);`;
  let safeValues = [day.search_query, day.forecast, day.time];

  client.query(SQL, safeValues)
    .then (data => console.log(data + 'weather was stored'));
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










