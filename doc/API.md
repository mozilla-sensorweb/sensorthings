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
```
### Response
```ssh
```

## GET /Things
### Request
```ssh
```
### Response
```ssh
```

## GET /Things(:id)
___Parameters___
* id - The id of the Thing to retrieve.

### Request
```ssh
```
### Response
```ssh
```

## POST /Things
### Request
```ssh
```
### Response
```ssh
```

## PATCH /Things(:id)
___Parameters___
* id - The id of the Thing to patch.

### Request
```ssh
```
### Response
```ssh
```

## DELETE /Things(:id)
___Parameters___
* id - The id of the Thing to delete.

### Request
```ssh
```
### Response
```ssh
```


## GET /Locations
### Request
```ssh
```
### Response
```ssh
```

## GET /Locations(:id)
___Parameters___
* id - The id of the Location to retrieve.

### Request
```ssh
```
### Response
```ssh
```

## POST /Locations
### Request
```ssh
```
### Response
```ssh
```

## PATCH /Locations(:id)
___Parameters___
* id - The id of the Location to patch.

### Request
```ssh
```
### Response
```ssh
```

## DELETE /Locations(:id)
___Parameters___
* id - The id of the Location to delete.

### Request
```ssh
```
### Response
```ssh
```


## GET /HistoricalLocations
### Request
```ssh
```
### Response
```ssh
```

## GET /HistoricalLocations(:id)
___Parameters___
* id - The id of the HistoricalLocation to retrieve.

### Request
```ssh
```
### Response
```ssh
```

## POST /HistoricalLocations
### Request
```ssh
```
### Response
```ssh
```

## PATCH /HistoricalLocations(:id)
___Parameters___
* id - The id of the HistoricalLocation to patch.

### Request
```ssh
```
### Response
```ssh
```

## DELETE /HistoricalLocations(:id)
___Parameters___
* id - The id of the HistoricalLocation to delete.

### Request
```ssh
```
### Response
```ssh
```


## GET /Datastreams
### Request
```ssh
```
### Response
```ssh
```

## GET /Datastreams(:id)
___Parameters___
* id - The id of the Datastream to retrieve.

### Request
```ssh
```
### Response
```ssh
```

## POST /Datastreams
### Request
```ssh
```
### Response
```ssh
```

## PATCH /Datastreams(:id)
___Parameters___
* id - The id of the Datastream to patch.

### Request
```ssh
```
### Response
```ssh
```

## DELETE /Datastreams(:id)
___Parameters___
* id - The id of the Datastream to delete.

### Request
```ssh
```
### Response
```ssh
```


## GET /Sensors
### Request
```ssh
```
### Response
```ssh
```

## GET /Sensors(:id)
___Parameters___
* id - The id of the Sensor to retrieve.

### Request
```ssh
```
### Response
```ssh
```

## POST /Sensors
### Request
```ssh
```
### Response
```ssh
```

## PATCH /Sensors(:id)
___Parameters___
* id - The id of the Sensor to patch.

### Request
```ssh
```
### Response
```ssh
```

## DELETE /Sensors(:id)
___Parameters___
* id - The id of the Sensor to delete.

### Request
```ssh
```
### Response
```ssh
```


## GET /ObservedProperties
### Request
```ssh
```
### Response
```ssh
```

## GET /ObservedProperties(:id)
___Parameters___
* id - The id of the ObservedProperty to retrieve.

### Request
```ssh
```
### Response
```ssh
```

## POST /ObservedProperties
### Request
```ssh
```
### Response
```ssh
```

## PATCH /ObservedProperties(:id)
___Parameters___
* id - The id of the ObservedProperty to patch.

### Request
```ssh
```
### Response
```ssh
```

## DELETE /ObservedProperties(:id)
___Parameters___
* id - The id of the ObservedProperty to delete.

### Request
```ssh
```
### Response
```ssh
```


## GET /Observations
### Request
```ssh
```
### Response
```ssh
```

## GET /Observations(:id)
___Parameters___
* id - The id of the Observation to retrieve.

### Request
```ssh
```
### Response
```ssh
```

## POST /Observations
### Request
```ssh
```
### Response
```ssh
```

## PATCH /Observations(:id)
___Parameters___
* id - The id of the Observation to patch.

### Request
```ssh
```
### Response
```ssh
```

## DELETE /Observations(:id)
___Parameters___
* id - The id of the Observation to delete.

### Request
```ssh
```
### Response
```ssh
```


## GET /FeaturesOfInterest
### Request
```ssh
```
### Response
```ssh
```

## GET /FeaturesOfInterest(:id)
___Parameters___
* id - The id of the FeatureOfInterest to retrieve.

### Request
```ssh
```
### Response
```ssh
```

## POST /FeaturesOfInterest
### Request
```ssh
```
### Response
```ssh
```

## PATCH /FeaturesOfInterest(:id)
___Parameters___
* id - The id of the FeatureOfInterest to patch.

### Request
```ssh
```
### Response
```ssh
```

## DELETE /FeaturesOfInterest(:id)
___Parameters___
* id - The id of the FeatureOfInterest to delete.

### Request
```ssh
```
### Response
```ssh
```
