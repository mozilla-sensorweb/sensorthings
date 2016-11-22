#!/usr/bin/env bash

export HOST=http://localhost:8080/v1.0

# CREATE PRECONDITIONS
# These are needed to run tests under Conformance Level 2
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json"  -d '{
    "description": "thing 1",
    "name": "thing name 1",
    "properties": {
        "reference": "first"
    },
    "Locations": [ {
        "description": "location 1",
        "name": "location name 1",
        "location": {
            "type": "Point",
            "coordinates": [ -117.05, 51.05 ]
        },
        "encodingType": "application/vnd.geo+json"
    } ],
    "Datastreams": [ {
        "unitOfMeasurement": {
            "name": "Lumen",
            "symbol": "lm",
            "definition": "http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html/Lumen"
        },
        "description": "datastream 1",
        "name": "datastream name 1",
        "observationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
        "resultTime": "2010-12-23T10:20:00.00-07:00",
        "ObservedProperty": {
            "name": "Luminous Flux",
            "definition": "http://www.qudt.org/qudt/owl/1.0.0/quantity/Instances.html/LuminousFlux",
            "description": "observedProperty 1"
        },
        "Sensor": {
            "description": "sensor 1",
            "name": "sensor name 1",
            "encodingType": "application/pdf", 
            "metadata": "Light flux sensor"
        },
        "Observations":[ {
            "phenomenonTime": "2015-03-03T00:00:00Z", 
            "result": 3,
            "resultTime": "2010-12-23T10:20:00.00-07:00"
        },
        {
            "phenomenonTime": "2015-03-04T00:00:00Z",
            "result": 4,
            "resultTime": "2010-12-23T10:20:00.00-07:00"
        } ] },
        {
        "unitOfMeasurement": {
            "name": "Centigrade",
            "symbol": "C",
            "definition": "http://www.qudt.org/qudt/owl/1.0.0/unit/Instances.html/Lumen"
        },
        "description":
            "datastream 2",
            "name": "datastream name 2",
            "observationType": "http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
            "resultTime": "2010-12-23T10:20:00.00-07:00",
            "ObservedProperty": {
                "name": "Temperature",
                "definition": "http://www.qudt.org/qudt/owl/1.0.0/quantity/Instances.html/Tempreture",
                "description":
                "observedProperty 2"
            },
            "Sensor": {
                "description": "sensor 2",
                "name": "sensor name 2",
                "encodingType": "application/pdf",
                "metadata": "Tempreture sensor" 
            },
            "Observations":[ {
                "phenomenonTime": "2015-03-05T00:00:00Z",
                "result": 5,
                "resultTime": "2010-12-23T10:20:00.00-07:00"
            },
            {
                "phenomenonTime": "2015-03-06T00:00:00Z",
                "result": 6,
                "resultTime": "2010-12-23T10:20:00.00-07:00"
            } ]
        } ]

}' "$HOST/Things"
