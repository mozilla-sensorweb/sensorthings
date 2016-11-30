# SensorThings API usage

This repository contains the implementation of the SensorThings API as an 
[npm](https://www.npmjs.com/) module.
This npm module exports a [Express](http://expressjs.com/) router implementing 
the SensorThings API as specified by the 
[OGC](http://docs.opengeospatial.org/is/15-078r6/15-078r6.html). 
At the time of writing this documentation, the latest revision of the API spec 
document was 15-078r6 (2016-07-26).

This code can be installed as an npm module via

```ssh
npm install sensorthings
```

Or can be built from source

```ssh
git clone https://github.com/mozilla-sensorweb/sensorthings.git
npm install
npm run build
```

In the latter case, the generated build will be located in the `dist` folder.

Once you have installed or built the SensorThings API you can use it along
with Express in this way

```javascript
const express      = require('express');
const SensorThings = require('../dist/sensorthings'); // or require('sensorthings')
                                                      // if you installed it via npm

var app = express();

const config = {
  db: {
    host: 'localhost',
    port: 5432,
    name: 'sensorweb',
    user: 'postgres',
    pass: '12345678'
  }
};

app.use('/', SensorThings(config));

app.listen(8080, () => console.log('Running on localhost:8080'));
```

There is an optional `version` configuration parameter that let's you define the 
version number that should appear within the endpoint URLS. 
It defaults to `v1.0` and the default endpoint URLs are of the form:

    https://<host-url>/v1.0/<api-endpoint>

For more details about the API you can check this [document](https://github.com/mozilla-sensorweb/sensorthings/blob/master/doc/API.md).

## Example requests

The following requests are an example of the normal usage that a new sensor
station can make of this API to register itself and start sending its
observations.

The usual steps are:

  1. Create a [Thing](http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#25).
  2. Create a [Location](http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#26) associated to the Thing.
  3. Create a [ObservedProperty](http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#30).
  4. Create a [Sensor](http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#29).
  5. Create a [Datastream](http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#28) associated to the Thing, the ObservedProperty and the Sensor.
  6. Create [Observations](http://docs.opengeospatial.org/is/15-078r6/15-078r6.html#31) associated to the Datastream.

If you want to try this yourself make sure that you:

* Replace http://localhost:8080 with the url of your own test server
* When something is created with a HTTP Post request, an @iot.id is returned. 
Use this @iot.id in subsequent request.

### 1. Create a Thing.
#### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "description": "A SensorWeb thing",
  "name":"SensorWebThing",
  "properties": {
    "organization": "Mozilla",
    "owner": "Mozilla"
  }
}' "http://localhost:8080/v1.0/Things"
```
#### Response
```ssh
{
  "@iot.id": 1,
  "@iot.selfLink": "http://localhost:8080/v1.0/Things(1)",
  "Locations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Locations",
  "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/HistoricalLocations",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Datastreams",
  "description": "A SensorWeb thing",
  "name": "SensorWebThing",
  "properties": {
    "owner": "Mozilla",
    "organization": "Mozilla"
  }
}
```
### 2. Create a Location associated to the Thing.
Note that we are using the `@iot.id` value returned as response to the previous 
request in the URL to let the API know that we want to associate this Location 
to the previously created Thing.

#### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
    "description": "My backyard",
    "name": "My backyard",
    "encodingType": "application/vnd.geo+json",
    "location": {
        "type": "Point",
        "coordinates": [-117.123, 54.123]
    }
}' "http://localhost:8080/v1.0/Things(1)/Locations"
```
#### Response
```ssh
{
  "@iot.id": 1,
  "@iot.selfLink": "http://localhost:8080/v1.0/Locations(1)",
  "Things@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/Things",
  "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/HistoricalLocations",
  "description": "My backyard",
  "name": "My backyard",
  "encodingType": "application/vnd.geo+json",
  "location": {
    "type": "Point",
    "coordinates": [
      -117.123,
      54.123
    ]
  }
}
```
### 3. Create a ObservedProperty.
#### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "name": "PM 2.5",
  "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air.",
  "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle"
}' "http://localhost:8080/v1.0/ObservedProperties"
```
#### Response
```ssh
{
  "@iot.id": 1,
  "@iot.selfLink": "http://localhost:8080/v1.0/ObservedProperties(1)",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/ObservedProperties(1)/Datastreams",
  "name": "PM 2.5",
  "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air.",
  "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle"
}
```
### 4. Create a Sensor.
#### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
	"description": "PM 2.5 sensor",
    "name": "PM25sensor",
    "encodingType": "application/pdf",
    "metadata": "http://particle-sensor.com/"
}' "http://localhost:8080/v1.0/Sensors"
```
#### Response
```ssh
{
  "@iot.id": 1,
  "@iot.selfLink": "http://localhost:8080/v1.0/Sensors(1)",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Sensors(1)/Datastreams",
  "description": "PM 2.5 sensor",
  "name": "PM25sensor",
  "encodingType": "application/pdf",
  "metadata": "http://particle-sensor.com/"
}
```
### 5. Create a Datastream associated to the Thing, the ObservedProperty and the Sensor.
#### Request
Note that we used the `@iot.id` values from the recently created Thing, ObservedProperty 
and Sensor to associate this Datastream to those entities.

```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
"unitOfMeasurement": {
        "symbol": "μg/m³",
        "name": "PM 2.5 Particulates (ug/m3)",
        "definition": "http://unitsofmeasure.org/ucum.html"
    },
  "observationType":"http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
  "description": "Air quality readings",
  "name": "air_quality_readings",
  "Thing": {"@iot.id": 1},
  "ObservedProperty": {"@iot.id": 1},
  "Sensor": {"@iot.id": 1}	
}' "http://localhost:8080/v1.0/Datastreams"
```
#### Response
```ssh
{
  "@iot.id": 1,
  "@iot.selfLink": "http://localhost:8080/v1.0/Datastreams(1)",
  "Thing@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Thing",
  "Sensor@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Sensor",
  "ObservedProperty@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/ObservedProperty",
  "Observations@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Observations",
  "unitOfMeasurement": {
    "name": "PM 2.5 Particulates (ug/m3)",
    "symbol": "μg/m³",
    "definition": "http://unitsofmeasure.org/ucum.html"
  },
  "description": "Air quality readings",
  "name": "air_quality_readings",
  "observedArea": null
}
```
### 6. Create Observations associated to the Datastream.
#### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "phenomenonTime": "2016-11-18T11:04:15.790Z",
  "resultTime" : "2016-11-18T11:04:15.790Z",
  "result" : 12.4,
  "Datastream":{"@iot.id": 1}
}' "http://localhost:8080/v1.0/Observations"
```
#### Response
```ssh
{
  "@iot.id": 1,
  "@iot.selfLink": "http://localhost:8080/v1.0/Observations(1)",
  "Datastream@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/Datastream",
  "FeaturesOfInterest@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/FeaturesOfInterest",
  "phenomenonTime": "2016-11-18T11:04:15.790Z",
  "resultTime": "2016-11-18T11:04:15.790Z",
  "result": 12.4,
  "parameters": null
}
```

## Deep Insert.

Alternatively, instead of creating five different requests, it is possible to 
do all the work to create a Datastream associated to a Thing, a ObservedProperty 
and a Sensor with all its details on a single request. 

### Request to deep insert a Datastream
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "unitOfMeasurement": {
    "symbol": "μg/m³",
    "name": "PM 2.5 Particulates (ug/m3)",
    "definition": "http://unitsofmeasure.org/ucum.html"
  },
  "observationType":"http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
  "description": "Air quality readings",
  "name": "air_quality_readings",
  "Thing": {
    "description": "A SensorWeb thing",
    "name":"SensorWebThing",
    "properties": {
      "organisation": "Mozilla",
      "owner": "Mozilla"
    },
    "Locations": [{
      "description": "My backyard",
      "name": "My backyard",
      "encodingType": "application/vnd.geo+json",
      "location": {
        "type": "Point",
        "coordinates": [-117.123, 54.123]
      }
    }]
  },
  "ObservedProperty": {
    "name": "PM 2.5",
    "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air.",
    "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle"
  },
  "Sensor": {
    "description": "PM 2.5 sensor",
    "name": "PM25sensor",
    "encodingType": "application/pdf",
    "metadata": "http://particle-sensor.com/"
  }
}' "http://localhost:8080/v1.0/Datastreams"
```

### Response
```ssh
{
  "@iot.id": "1",
  "@iot.selfLink": "http://localhost:8080/v1.0/Datastreams(1)",
  "Thing@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Thing",
  "Sensor@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Sensor",
  "ObservedProperty@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/ObservedProperty",
  "Observations@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Observations",
  "unitOfMeasurement": {
    "name": "PM 2.5 Particulates (ug/m3)",
    "symbol": "μg/m³",
    "definition": "http://unitsofmeasure.org/ucum.html"
  },
  "observationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
  "description": "Air quality readings",
  "name": "air_quality_readings",
  "observedArea": null
}
```

Subsequent requests to add new Observations will look exactly like before. You 
just need to specify the id of the Datastream where you want to push these observations. 
In this case, if you want to push an Observation to the Datastream you just created 
via deep insert, you can send this request:

```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "phenomenonTime": "2016-11-18T11:04:15.790Z",
  "resultTime" : "2016-11-18T11:04:15.790Z",
  "result" : 12.4
}' "http://localhost:8080/v1.0/Datastreams(1)/Observations"
```

Which should reply with something like:

```ssh
{
  "@iot.id": "1",
  "@iot.selfLink": "http://localhost:8080/v1.0/Observations(1)",
  "Datastream@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/Datastream",
  "FeatureOfInterest@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/FeatureOfInterest",
  "phenomenonTime": "2016-11-18T11:04:15.790Z",
  "resultTime": "2016-11-18T11:04:15.790Z",
  "result": 12.4,
  "parameters": null
}
```

## Querying the API

Until we have the query language ready, querying the API to get data is a bit 
painful. 

For example, let's say that you want to implement something similar to 
[http://calgary-air.sensorup.com/](http://calgary-air.sensorup.com/). 
Which:

* Shows on a map a list of registered Things that have an 
active Datastream.
* Changes how  each of these Datastreams look like on the map based on its 
associated Observations
* Shows details about each Observation result if the user clicks on the map. 

In order to get enough data from the API to do that, you need to do the 
following requests:

### Placing dots on a map Get.
First of all, you need to get the list of registered Datastreams. Without, the 
query language, you'll get the entire list (sorry!).

#### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Datastreams"
```

#### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.id": "1",
      "@iot.selfLink": "http://localhost:8080/v1.0/Datastreams(1)",
      "Thing@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Thing",
      "Sensor@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Sensor",
      "ObservedProperty@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/ObservedProperty",
      "Observations@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Observations",
      "name": "air_quality_readings",
      "description": "Air quality readings",
      "unitOfMeasurement": {
        "name": "PM 2.5 Particulates (ug/m3)",
        "symbol": "μg/m³",
        "definition": "http://unitsofmeasure.org/ucum.html"
      },
      "observedArea": null,
      "observationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement"
    }
  ]
}
```

In this case, the above response only shows one Datastream. For each Datastream 
we care about two associations:

* its Location, to be able to place a dot on the map.
* its Observations, to be able to modify how this dot looks on the map and to 
show the list of results if the user clicks on it.

In order to get its Locations we first need to get the Datastream associated 
Thing by following the `Thing@iot.navigationLink` navigation link.

#### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Datastreams(1)/Thing"
```

#### Response
```ssh
{
  "@iot.id": "1",
  "@iot.selfLink": "http://localhost:8080/v1.0/Things(1)",
  "Locations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Locations",
  "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/HistoricalLocations",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Datastreams",
  "name": "SensorWebThing",
  "description": "A SensorWeb thing",
  "properties": {
    "owner": "Mozilla",
    "organisation": "Mozilla"
  }
}
```

Once we have the Datastream associated Thing, we query its Locations.

#### Request

```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Things(1)/Locations"
```

#### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.id": "1",
      "@iot.selfLink": "http://localhost:8080/v1.0/Locations(1)",
      "Things@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/Things",
      "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/HistoricalLocations",
      "name": "My backyard",
      "description": "My backyard",
      "encodingType": "application/vnd.geo+json",
      "location": {
        "type": "Point",
        "coordinates": [
          -117.123,
          54.123
        ]
      }
    }
  ]
}
```

With this information we should be able to place a dot on a map at coordinates 
`[-117.123, 54.123]`. 

Now we need to know how this dot looks like. So we query the list of Observations 
associated to the Datastream by following the `Observations@iot.navigationLink` 
navigation link that we got in the first request.

#### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Datastreams(1)/Observations"
```

#### Response
```ssh
{
  "@iot.count": 2,
  "value": [
    {
      "@iot.id": "1",
      "@iot.selfLink": "http://localhost:8080/v1.0/Observations(1)",
      "Datastream@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/Datastream",
      "FeatureOfInterest@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/FeatureOfInterest",
      "phenomenonTime": "2016-11-18T11:04:15.790Z",
      "result": 12.4,
      "resultTime": "2016-11-18T11:04:15.790Z",
      "parameters": null
    },
    {
      "@iot.id": "2",
      "@iot.selfLink": "http://localhost:8080/v1.0/Observations(2)",
      "Datastream@iot.navigationLink": "http://localhost:8080/v1.0/Observations(2)/Datastream",
      "FeatureOfInterest@iot.navigationLink": "http://localhost:8080/v1.0/Observations(2)/FeatureOfInterest",
      "phenomenonTime": "2016-11-18T11:04:15.790Z",
      "result": 14.4,
      "resultTime": "2016-11-18T11:04:15.790Z",
      "parameters": null
    }
  ]
}
```

These give us two observations. One with result `12.4` and the other one with 
result `14.4`. With these two values, you can decide how you want your dot to 
look like on the map. And you can list the observations registered for the 
dot.
