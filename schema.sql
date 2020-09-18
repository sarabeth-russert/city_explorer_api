DROP TABLE IF EXISTS citydata;

CREATE TABLE citydata (
  ID SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude decimal,
  longitude decimal
);

DROP TABLE IF EXISTS weatherdata;

CREATE TABLE weatherdata (
  ID SERIAL PRIMARY KEY,
  search_query VARCHAR(255),
  forecast VARCHAR(255),
  time VARCHAR(10)
);

INSERT INTO weatherdata (search_query, forecast, time) VALUES ('seattle', 'awesome', '9/14/2010');
