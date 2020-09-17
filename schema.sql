DROP TABLE IF EXISTS citydata;

CREATE TABLE citydata (
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude DECIMAL(6, 2),
  longitude DECIMAL(6, 2)
)