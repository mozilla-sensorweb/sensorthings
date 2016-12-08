# SensorThings API

This document provides protocol-level details of the SensorThings API.

---

# HTTP API

## URL Structure

All requests will be to URLs of the form:

    https://<host-url>/v1.0/<api-endpoint>

Note that:

* All API access must be over a properly-validated HTTPS connection.
* The URL embeds a version identifier "v1.0"; future revisions of this API may
introduce new version numbers.

## Request Format

All POST and PATCH requests must have a content-type of `application/json` with
a utf8-encoded JSON body.

## Response Format
All successful requests will produce a response with HTTP status code of "20X"
and content-type of "application/json".  The structure of the response body
will depend on the endpoint in question.

Failures due to invalid behavior from the client will produce a response with
HTTP status code in the "4XX" range and content-type of "application/json".  
Failures due to an unexpected situation on the server side will produce a
response with HTTP status code in the "5XX" range and content-type of
"application/json".

To simplify error handling for the client, the type of error is indicated both
by a particular HTTP status code, and by an application-specific error code in
the JSON response body.  For example:

```js
{
  "code": 400, // matches the HTTP status code
  "errno": 777, // stable application-level error number
  "error": "Bad Request", // string description of the error type
  "message": "the value of salt is not allowed to be undefined"
}
```

Responses for particular types of error may include additional parameters.

The currently-defined error responses are:

* status code 400, errno 400: Bad request.
* status code 500, errno 500: Internal server error.

# API Endpoints

* [GET /](#get)
* Things
  * [GET /Things](#get-things)
  * [GET /Things(:id)](#get-thingsid)
  * [POST /Things](#post-things)
  * [PATCH /Things(:id)](#patch-thingsid)
  * [DELETE /Things(:id)](#delete-thingsid)
* Locations
  * [GET /Locations](#get-locations)
  * [GET /Locations(:id)](#get-locationsid)
  * [POST /Locations](#post-locations)
  * [PATCH /Locations(:id)](#patch-locationsid)
  * [DELETE /Locations(:id)](#delete-locationsid)
* HistoricalLocations
  * [GET /HistoricalLocations](#get-historicallocations)
  * [GET /HistoricalLocations(:id)](#get-historicallocationsid)
  * [POST /HistoricalLocations](#post-historicallocations)
  * [PATCH /HistoricalLocations(:id)](#patch-historicallocationsid)
  * [DELETE /HistoricalLocations(:id)](#delete-historicallocationsid)
* Datastreams
  * [GET /Datastreams](#get-datastreams)
  * [GET /Datastreams(:id)](#get-datastreamsid)
  * [POST /Datastreams](#post-datastreams)
  * [PATCH /Datastreams(:id)](#patch-datastreamsid)
  * [DELETE /Datastreams(:id)](#delete-datastreamsid)
* Sensors
  * [GET /Sensors](#get-sensors)
  * [GET /Sensors(:id)](#get-sensorsid)
  * [POST /Sensors](#post-sensors)
  * [PATCH /Sensors(:id)](#patch-sensorsid)
  * [DELETE /Sensors(:id)](#delete-sensorsid)
* ObservedProperties
  * [GET /ObservedProperties](#get-observedproperties)
  * [GET /ObservedProperties(:id)](#get-observedpropertiesid)
  * [POST /ObservedProperties](#post-observedproperties)
  * [PATCH /ObservedProperties(:id)](#patch-observedpropertiesid)
  * [DELETE /ObservedProperties(:id)](#delete-observedpropertiesid)
* Observations
  * [GET /Observations](#get-observations)
  * [GET /Observations(:id)](#get-observationsid)
  * [POST /Observations](#post-observations)
  * [PATCH /Observations(:id)](#patch-observationsid)
  * [DELETE /Observations(:id)](#delete-observationsid)
* FeaturesOfInterest
  * [GET /FeaturesOfInterest](#get-featuresofinterest)
  * [GET /FeaturesOfInterest(:id)](#get-featuresofinterestid)
  * [POST /FeaturesOfInterest](#post-featuresofinterest)
  * [PATCH /FeaturesOfInterest(:id)](#patch-featuresofinterestid)
  * [DELETE /FeaturesOfInterest(:id)](#delete-featuresofinterestid)

## GET /
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0"
```
### Response
```ssh
{
  "value": [
    {
      "name": "Datastreams",
      "url": "http://localhost:8080/v1.0/Datastreams"
    },
    {
      "name": "FeaturesOfInterest",
      "url": "http://localhost:8080/v1.0/FeaturesOfInterest"
    },
    {
      "name": "HistoricalLocations",
      "url": "http://localhost:8080/v1.0/HistoricalLocations"
    },
    {
      "name": "Locations",
      "url": "http://localhost:8080/v1.0/Locations"
    },
    {
      "name": "Observations",
      "url": "http://localhost:8080/v1.0/Observations"
    },
    {
      "name": "ObservedProperties",
      "url": "http://localhost:8080/v1.0/ObservedProperties"
    },
    {
      "name": "Sensors",
      "url": "http://localhost:8080/v1.0/Sensors"
    },
    {
      "name": "Things",
      "url": "http://localhost:8080/v1.0/Things"
    }
  ]
}
```

## GET /Things
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Things"
```
### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.selfLink": "http://localhost:8080/v1.0/Things(1)",
      "@iot.id": "1",
      "Locations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Locations",
      "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/HistoricalLocations",
      "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Datastreams",
      "name": "SensorWebThing",
      "description": "A SensorWeb thing",
      "properties": {
        "owner": "Mozilla",
        "organization": "Mozilla"
      }
    }
  ]
}
```

## GET /Things(:id)
___Parameters___
* id - The id of the Thing to retrieve.

### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Things(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Things(1)",
  "@iot.id": "1",
  "Locations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Locations",
  "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/HistoricalLocations",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Datastreams",
  "name": "SensorWebThing",
  "description": "A SensorWeb thing",
  "properties": {
    "owner": "Mozilla",
    "organization": "Mozilla"
  }
}
```

## POST /Things
### Request
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
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Things(1)",
  "@iot.id": "1",
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

## PATCH /Things(:id)
___Parameters___
* id - The id of the Thing to patch.

### Request
```ssh
curl -X PATCH -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "description": "A SensorWeb thing",
  "name":"New SensorWebThing",
  "properties": {
    "organization": "Mozilla",
    "owner": "Mozilla"
  }
}' "http://localhost:8080/v1.0/Things(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Things(1)",
  "@iot.id": "1",
  "Locations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Locations",
  "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/HistoricalLocations",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Things(1)/Datastreams",
  "name": "New SensorWebThing",
  "description": "A SensorWeb thing",
  "properties": {
    "owner": "Mozilla",
    "organization": "Mozilla"
  }
}
```


## DELETE /Things(:id)
___Parameters___
* id - The id of the Thing to delete.

### Request
```ssh
curl -X DELETE -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Things(1)"
```
### Response
```ssh
Response body empty. Response Headers: Status Code 204 No Content
```


## GET /Locations
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Locations"
```
### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.selfLink": "http://localhost:8080/v1.0/Locations(1)",
      "@iot.id": "2",
      "Things@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/Things",
      "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/HistoricalLocations",
      "name": "My Location",
      "description": "Backyard",
      "encodingType": "application/vnd.geo+json",
      "location": {
        "type": "Point",
        "coordinates": [
          4.913329,
          52.343029
        ]
      }
    }
  ]
}
```

## GET /Locations(:id)
___Parameters___
* id - The id of the Location to retrieve.

### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Locations(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Locations(1)",
  "@iot.id": "1",
  "Things@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/Things",
  "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/HistoricalLocations",
  "name": "My Location",
  "description": "Backyard",
  "encodingType": "application/vnd.geo+json",
  "location": {
    "type": "Point",
    "coordinates": [
      4.913329,
      52.343029
    ]
  }
}
```

## POST /Locations
### Request
```ssh
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json"  -d '{
  "name": "My Location",
  "description": "Backyard",
  "encodingType": "application/vnd.geo+json",
  "location": {
    "type": "Point",
    "coordinates": [4.913329, 52.343029]
      }
}' "http://localhost:8080/v1.0/Locations"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Locations(1)",
  "@iot.id": "1",
  "Things@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/Things",
  "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/HistoricalLocations",
  "name": "My Location",
  "description": "Backyard",
  "encodingType": "application/vnd.geo+json",
  "location": {
    "type": "Point",
    "coordinates": [
      4.913329,
      52.343029
    ]
  }
}
```

## PATCH /Locations(:id)
___Parameters___
* id - The id of the Location to patch.

### Request
```ssh
curl -X PATCH -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "name": "My Location has changed",
  "description": "Backyard",
  "encodingType": "application/vnd.geo+json",
  "location": {
    "type": "Point",
    "coordinates": [4.913329, 52.343029]
      }
}' "http://localhost:8080/v1.0/Locations(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Locations(1)",
  "@iot.id": "1",
  "Things@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/Things",
  "HistoricalLocations@iot.navigationLink": "http://localhost:8080/v1.0/Locations(1)/HistoricalLocations",
  "name": "My Location has changed",
  "description": "Backyard",
  "encodingType": "application/vnd.geo+json",
  "location": {
    "type": "Point",
    "coordinates": [
      4.913329,
      52.343029
    ]
  }
}
```

## DELETE /Locations(:id)
___Parameters___
* id - The id of the Location to delete.

### Request
```ssh
curl -X DELETE -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Locations(1)"
```
### Response
```ssh
Response body empty. Response Headers: Status Code 204 No Content
```


## GET /HistoricalLocations
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/HistoricalLocations"
```
### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.selfLink": "http://localhost:8080/v1.0/HistoricalLocations(1)",
      "@iot.id": "1",
      "Thing@iot.navigationLink": "http://localhost:8080/v1.0/HistoricalLocations(1)/Thing",
      "Locations@iot.navigationLink": "http://localhost:8080/v1.0/HistoricalLocations(1)/Locations",
      "time": "2014-12-31T03:59:59.000Z"
    }
  ]
}
```

## GET /HistoricalLocations(:id)
___Parameters___
* id - The id of the HistoricalLocation to retrieve.

### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/HistoricalLocations(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/HistoricalLocations(1)",
  "@iot.id": "2",
  "Thing@iot.navigationLink": "http://localhost:8080/v1.0/HistoricalLocations(1)/Thing",
  "Locations@iot.navigationLink": "http://localhost:8080/v1.0/HistoricalLocations(1)/Locations",
  "time": "2014-12-31T03:59:59.000Z"
}
```

## POST /HistoricalLocations
### Request
```ssh
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
     "time": "2014-12-31T11:59:59.00+08:00"
}' "http://localhost:8080/v1.0/HistoricalLocations"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/HistoricalLocations(1)",
  "@iot.id": "1",
  "Thing@iot.navigationLink": "http://localhost:8080/v1.0/HistoricalLocations(1)/Thing",
  "Locations@iot.navigationLink": "http://localhost:8080/v1.0/HistoricalLocations(1)/Locations",
  "time": "2014-12-31T03:59:59.000Z"
}
```

## PATCH /HistoricalLocations(:id)
___Parameters___
* id - The id of the HistoricalLocation to patch.

### Request
```ssh
curl -X PATCH -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "time":"2018-12-31T03:59:59.000Z"
}' "http://localhost:8080/v1.0/HistoricalLocations(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/HistoricalLocations(1)",
  "@iot.id": "1",
  "Thing@iot.navigationLink": "http://localhost:8080/v1.0/HistoricalLocations(1)/Thing",
  "Locations@iot.navigationLink": "http://localhost:8080/v1.0/HistoricalLocations(1)/Locations",
  "time": "2018-12-31T03:59:59.000Z"
}
```

## DELETE /HistoricalLocations(:id)
___Parameters___
* id - The id of the HistoricalLocation to delete.

### Request
```ssh
curl -X DELETE -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/HistoricalLocations(1)"
```
### Response
```ssh
Response body empty. Response Headers: Status Code 204 No Content
```


## GET /Datastreams
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Datastreams"
```
### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.selfLink": "http://localhost:8080/v1.0/Datastreams(5)",
      "@iot.id": "5",
      "Thing@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(5)/Thing",
      "Sensor@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(5)/Sensor",
      "ObservedProperty@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(5)/ObservedProperty",
      "Observations@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(5)/Observations",
      "name": "air_quality_readings",
      "description": "Air quality readings",
      "unitOfMeasurement": {
        "name": "PM 2.5 Particulates (ug/m3)",
        "symbol": "u03bcg/mu00b3",
        "definition": "http://unitsofmeasure.org/ucum.html"
      },
      "observedArea": null,
      "observationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement"
    }
  ]
}
```

## GET /Datastreams(:id)
___Parameters___
* id - The id of the Datastream to retrieve.

### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Datastreams(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Datastreams(5)",
  "@iot.id": "5",
  "Thing@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(5)/Thing",
  "Sensor@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(5)/Sensor",
  "ObservedProperty@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(5)/ObservedProperty",
  "Observations@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(5)/Observations",
  "name": "air_quality_readings",
  "description": "Air quality readings",
  "unitOfMeasurement": {
    "name": "PM 2.5 Particulates (ug/m3)",
    "symbol": "u03bcg/mu00b3",
    "definition": "http://unitsofmeasure.org/ucum.html"
  },
  "observedArea": null,
  "observationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement"
}
```

## POST /Datastreams
### Request
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
### Response
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

## PATCH /Datastreams(:id)
___Parameters___
* id - The id of the Datastream to patch.

### Request
```ssh
curl -X PATCH -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
"unitOfMeasurement": {
        "symbol": "ºC",
        "name": "Celsius",
        "definition": "http://unitsofmeasure.org/ucum.html"
    },
  "observationType":"http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
  "description": "Temp readings",
  "name": "temp_readings",
  "Thing": {"@iot.id": 1},
  "ObservedProperty": {"@iot.id": 1},
  "Sensor": {"@iot.id": 1}
}' "http://localhost:8080/v1.0/Datastreams"
```
### Response
```ssh
{
  "@iot.id": 1,
  "@iot.selfLink": "http://localhost:8080/v1.0/Datastreams(1)",
  "Thing@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Thing",
  "Sensor@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Sensor",
  "ObservedProperty@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/ObservedProperty",
  "Observations@iot.navigationLink": "http://localhost:8080/v1.0/Datastreams(1)/Observations",
  "unitOfMeasurement": {
    "symbol": "ºC",
    "name": "Celsius",
    "definition": "http://unitsofmeasure.org/ucum.html"
  },
  "description": "Temp readings",
  "name": "temp_readings",
  "observedArea": null
}
```

## DELETE /Datastreams(:id)
___Parameters___
* id - The id of the Datastream to delete.

### Request
```ssh
curl -X DELETE -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Datastreams(1)"
```
### Response
```ssh
Response body empty. Response Headers: Status Code 204 No Content
```


## GET /Sensors
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Sensors"
```
### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.selfLink": "http://localhost:8080/v1.0/Sensors(1)",
      "@iot.id": "1",
      "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Sensors(1)/Datastreams",
      "name": "PM25sensor",
      "description": "PM 2.5 sensor",
      "encodingType": "application/pdf",
      "metadata": "http://particle-sensor.com/"
    }
  ]
}
```

## GET /Sensors(:id)
___Parameters___
* id - The id of the Sensor to retrieve.

### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Sensors(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Sensors(1)",
  "@iot.id": "1",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Sensors(1)/Datastreams",
  "name": "PM25sensor",
  "description": "PM 2.5 sensor",
  "encodingType": "application/pdf",
  "metadata": "http://particle-sensor.com/"
}
```

## POST /Sensors
### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
    "description": "PM 2.5 sensor",
    "name": "PM25sensor",
    "encodingType": "application/pdf",
    "metadata": "http://particle-sensor.com/"
}' "http://localhost:8080/v1.0/Sensors"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Sensors(1)",
  "@iot.id": "1",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Sensors(1)/Datastreams",
  "description": "PM 2.5 sensor",
  "name": "PM25sensor",
  "encodingType": "application/pdf",
  "metadata": "http://particle-sensor.com/"
}
```

## PATCH /Sensors(:id)
___Parameters___
* id - The id of the Sensor to patch.

### Request
```ssh
curl -X PATCH -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
    "description": "This is a new PM 2.5 sensor",
    "name": "PM25sensor",
    "encodingType": "application/pdf",
    "metadata": "http://particle-sensor.com/"
}' "http://localhost:8080/v1.0/Sensors"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Sensors(1)",
  "@iot.id": "1",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/Sensors(1)/Datastreams",
  "description": "This is a new PM 2.5 sensor",
  "name": "PM25sensor",
  "encodingType": "application/pdf",
  "metadata": "http://particle-sensor.com/"
}
```

## DELETE /Sensors(:id)
___Parameters___
* id - The id of the Sensor to delete.

### Request
```ssh
curl -X DELETE -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Sensors(1)"
```
### Response
```ssh
Response body empty. Response Headers: Status Code 204 No Content
```


## GET /ObservedProperties
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/ObservedProperty"
```
### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.selfLink": "http://localhost:8080/v1.0/ObservedProperties(1)",
      "@iot.id": "1",
      "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/ObservedProperties(1)/Datastreams",
      "name": "PM 2.5",
      "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle",
      "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air."
    }
  ]
}
```

## GET /ObservedProperties(:id)
___Parameters___
* id - The id of the ObservedProperty to retrieve.

### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/ObservedProperties(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/ObservedProperties(1)",
  "@iot.id": "1",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/ObservedProperties(1)/Datastreams",
  "name": "PM 2.5",
  "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle",
  "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air."
}
```

## POST /ObservedProperties
### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "name": "PM 2.5",
  "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air.",
  "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle"
}' "http://localhost:8080/v1.0/ObservedProperties"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/ObservedProperties(1)",
  "@iot.id": "1",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/ObservedProperties(1)/Datastreams",
  "name": "PM 2.5",
  "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air.",
  "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle"
}
```

## PATCH /ObservedProperties(:id)
___Parameters___
* id - The id of the ObservedProperty to patch.

### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "name": "New PM 2.5 Observation",
  "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air.",
  "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle"
}' "http://localhost:8080/v1.0/ObservedProperties"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/ObservedProperties(1)",
  "@iot.id": "1",
  "Datastreams@iot.navigationLink": "http://localhost:8080/v1.0/ObservedProperties(1)/Datastreams",
  "name": "New PM 2.5 Observation",
  "description": "Particle pollution, also called particulate matter or PM, is a mixture of solids and liquid droplets floating in the air.",
  "definition": "https://airnow.gov/index.cfm?action=aqibasics.particle"
}
```

## DELETE /ObservedProperties(:id)
___Parameters___
* id - The id of the ObservedProperty to delete.

### Request
```ssh
curl -X DELETE -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/ObservedProperties(1)"
```
### Response
```ssh
Response body empty. Response Headers: Status Code 204 No Content
```


## GET /Observations
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Observations"
```
### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.selfLink": "http://localhost:8080/v1.0/Observations(1)",
      "@iot.id": "1",
      "Datastream@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/Datastream",
      "FeatureOfInterest@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/FeatureOfInterest",
      "phenomenonTime": "2014-12-31T03:59:59.000Z",
      "result": 80.1,
      "resultTime": "2014-12-31T03:59:59.000Z",
      "parameters": null
    }
  ]
}
```

## GET /Observations(:id)
___Parameters___
* id - The id of the Observation to retrieve.

### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Observations(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Observations(1)",
  "@iot.id": "1",
  "Datastream@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/Datastream",
  "FeatureOfInterest@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/FeatureOfInterest",
  "phenomenonTime": "2014-12-31T03:59:59.000Z",
  "result": 80.1,
  "resultTime": "2014-12-31T03:59:59.000Z",
  "parameters": null
}
```

## POST /Observations
### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "phenomenonTime": "2016-11-18T11:04:15.790Z",
  "resultTime" : "2016-11-18T11:04:15.790Z",
  "result" : 12.4,
  "Datastream":{"@iot.id": 1},
  "FeatureOfInterest":{"@iot.id": 1}
}' "http://localhost:8080/v1.0/Observations"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Observations(1)",
  "@iot.id": "1",
  "Datastream@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/Datastream",
  "FeatureOfInterest@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/FeatureOfInterest",
  "phenomenonTime": "2016-11-18T11:04:15.790Z",
  "resultTime": "2016-11-18T11:04:15.790Z",
  "result": 12.4,
  "parameters": null
}
```

## PATCH /Observations(:id)
___Parameters___
* id - The id of the Observation to patch.

### Request
```ssh
curl -X PATCH -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "phenomenonTime": "2016-11-18T11:04:15.790Z",
  "resultTime" : "2016-11-18T11:04:15.790Z",
  "result" : 20.4,
  "Datastream":{"@iot.id": 1},
  "FeatureOfInterest":{"@iot.id": 1}
}' "http://localhost:8080/v1.0/Observations"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/Observations(1)",
  "@iot.id": "1",
  "Datastream@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/Datastream",
  "FeatureOfInterest@iot.navigationLink": "http://localhost:8080/v1.0/Observations(1)/FeatureOfInterest",
  "phenomenonTime": "2016-11-18T11:04:15.790Z",
  "resultTime": "2016-11-18T11:04:15.790Z",
  "result": 20.4,
  "parameters": null
}
```

## DELETE /Observations(:id)
___Parameters___
* id - The id of the Observation to delete.

### Request
```ssh
curl -X DELETE -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/Observations(1)"
```
### Response
```ssh
Response body empty. Response Headers: Status Code 204 No Content
```


## GET /FeaturesOfInterest
### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/FeaturesOfInterest"
```
### Response
```ssh
{
  "@iot.count": 1,
  "value": [
    {
      "@iot.selfLink": "http://localhost:8080/v1.0/FeaturesOfInterest(1)",
      "@iot.id": "1",
      "Observations@iot.navigationLink": "http://localhost:8080/v1.0/FeaturesOfInterest(1)/Observations",
      "name": "fetureOfInterest 1",
      "description": "description foi 1",
      "encodingType": "application/vnd.geo+json",
      "feature": {
        "type": "Point",
        "coordinates": [
          -114.06,
          51.05
        ]
      }
    }
  ]
}
```

## GET /FeaturesOfInterest(:id)
___Parameters___
* id - The id of the FeatureOfInterest to retrieve.

### Request
```ssh
curl -X GET -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/FeaturesOfInterest(1)"
```
### Response
```ssh
{
  "@iot.selfLink": "http://localhost:8080/v1.0/FeaturesOfInterest(1)",
  "@iot.id": "1",
  "Observations@iot.navigationLink": "http://localhost:8080/v1.0/FeaturesOfInterest(1)/Observations",
  "name": "fetureOfInterest 1",
  "description": "description foi 1",
  "encodingType": "application/vnd.geo+json",
  "feature": {
    "type": "Point",
    "coordinates": [
      -114.06,
      51.05
    ]
  }
}
```

## POST /FeaturesOfInterest
### Request
```ssh
curl -X POST -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "name": "Weather Station YYC.",
  "description": "This is a weather station located at the Calgary Airport.",
  "encodingType": "application/vnd.geo+json",
  "feature": {
    "type": "Point",
    "coordinates": [
      -114.06,
      51.05
    ]
  }
}' "http://localhost:8080/v1.0/FeaturesOfInterest"
```
### Response
```ssh
{
  "@iot.id": "1",
  "@iot.selfLink": "http://localhost:8080/v1.0/FeaturesOfInterest(1)",
  "Observations@iot.navigationLink": "http://localhost:8080/v1.0/FeaturesOfInterest(1)/Observations",
  "name": "Weather Station YYC.",
  "description": "This is a weather station located at the Calgary Airport.",
  "encodingType": "application/vnd.geo+json",
  "feature": {
    "type": "Point",
    "coordinates": [
      -114.06,
      51.05
    ]
  }
}
```

## PATCH /FeaturesOfInterest(:id)
___Parameters___
* id - The id of the FeatureOfInterest to patch.

### Request
```ssh
curl -X PATCH -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{
  "name": "New Weather Station",
  "description": "This is a weather station located at the Calgary Airport.",
  "encodingType": "application/vnd.geo+json",
  "feature": {
    "type": "Point",
    "coordinates": [
      -114.06,
      51.05
    ]
  }
}' "http://localhost:8080/v1.0/FeaturesOfInterest"
```
### Response
```ssh
{
  "@iot.id": "1",
  "@iot.selfLink": "http://localhost:8080/v1.0/FeaturesOfInterest(1)",
  "Observations@iot.navigationLink": "http://localhost:8080/v1.0/FeaturesOfInterest(1)/Observations",
  "name": "New Weather Station",
  "description": "This is a weather station located at the Calgary Airport.",
  "encodingType": "application/vnd.geo+json",
  "feature": {
    "type": "Point",
    "coordinates": [
      -114.06,
      51.05
    ]
  }
}
```

## DELETE /FeaturesOfInterest(:id)
___Parameters___
* id - The id of the FeatureOfInterest to delete.

### Request
```ssh
curl -X DELETE -H "Cache-Control: no-cache" "http://localhost:8080/v1.0/FeaturesOfInterest(1)"
```
### Response
```ssh
Response body empty. Response Headers: Status Code 204 No Content
```
