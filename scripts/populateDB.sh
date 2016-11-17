#!/usr/bin/env bash

export HOST=http://localhost:8080

# CREATE THINGS
# ----------------------------------------
# Create Thing(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json"  -d '{
    "name": "PM2.5 1",
    "description": "PM2.5 air pollution",
    "properties": {
        "id": "11111111",
        "owner": "User 1"
    }
}' "$HOST/Things"

# ----------------------------------------
# Create Thing(2)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json"  -d '{
    "name": "PM2.5 2",
    "description": "PM2.5 air pollution 2",
    "properties": {
        "id": "22222222",
        "owner": "User 2"
    }
}' "$HOST/Things"

# ----------------------------------------
# Create Thing(3)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json"  -d '{
    "name": "PM2.5 3",
    "description": "PM2.5 air pollution 3",
    "properties": {
        "id": "333",
        "owner": "User 3"
    }
}' "$HOST/Things"

# CREATE LOCATIONS
# ----------------------------------------
# Create Location(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json"  -d '{
    "name": "Location 1",
    "description": "1st floor",
    "encodingType": "application/vnd.geo+json",
    "location": {
        "type": "Point",
        "coordinates": [4.913329, 52.343029]
    }
}' "$HOST/Locations"

# ----------------------------------------
# Create Location(2)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json"  -d '{
    "name": "Location 2",
    "description": "2nd floor",
    "encodingType": "application/vnd.geo+json",
    "location": {
        "type": "Point",
        "coordinates": [4.913329, 52.343029]
    }
}' "$HOST/Locations"

# ----------------------------------------
# Create Location(3)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json"  -d '{
    "name": "Location 3",
    "description": "3rd floor",
    "encodingType": "application/vnd.geo+json",
    "location": {
        "type": "Point",
        "coordinates": [4.913329, 52.343029]
    }
}' "$HOST/Locations"

# CREATE OBSERVED PROPERTIES
# ----------------------------------------
# Quality ObservedProperties(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "Air quality",
    "description": "Quality of air",
    "definition": "http://mmisw.org/ont/ioos/parameter/air_temperature"
}' "$HOST/ObservedProperties"

# ----------------------------------------
# Humidity ObservedProperties(2)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "Air humidity",
    "description": "Humidity of air",
    "definition": "http://mmisw.org/ont/ioos/parameter/humidity"
}' "$HOST/ObservedProperties"

# ----------------------------------------
# CO2 ObservedProperties(3)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "CO2",
    "description": "CO2 concentration air",
    "definition": "https://www.co2.earth/daily-co2"
}' "$HOST/ObservedProperties"

# ----------------------------------------
# Temperature ObservedProperties(4)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "Air temperature",
    "description": "Temperature of the air",
    "definition": "http://unitsofmeasure.org/ucum.html#para-30"
}' "$HOST/ObservedProperties"

# CREATE SENSORS
# ----------------------------------------
# Sensors(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "Sensor PM2.5 1",
    "description": "Air quality",
    "encodingType": "application/pdf",
    "metadata": "https://wiki.mozilla.org/Connected_Devices/Projects/SensorWeb"
}' "$HOST/Sensors"

# ----------------------------------------
# Sensors(2)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "Sensor PM2.5 2",
    "description": "Air humidity",
    "encodingType": "application/pdf",
    "metadata": "https://wiki.mozilla.org/Connected_Devices/Projects/SensorWeb"
}' "$HOST/Sensors"

# ----------------------------------------
# Sensors(3)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "Sensor PM2.5 3",
    "description": "Air CO2 concentration",
    "encodingType": "application/pdf",
    "metadata": "https://wiki.mozilla.org/Connected_Devices/Projects/SensorWeb"
}' "$HOST/Sensors"

# CREATE DATASTREAMS
# ----------------------------------------
# Things(1) Sensors(1) Datastreams(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "unitOfMeasurement": {
        "symbol": "μg/m3",
        "name": "unit",
        "definition": "https://www.health.ny.gov/environmental/indoors/air/pmq_a.htm"
    },
    "name": "Air quality Thing 1",
    "observationType":"https://www.health.ny.gov/environmental/indoors/air/pmq_a.htm",
    "description": "Air quality PM outdoor",
    "Thing": {"@iot.id": 1},
    "ObservedProperty": {"@iot.id": 1},
    "Sensor": {"@iot.id": 1}
}' "$HOST/Datastreams"

# ----------------------------------------
# Things(2) Sensors(2) Datastreams(2)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "unitOfMeasurement": {
        "symbol": "%",
        "name": "humidity",
        "definition": "http://unitsofmeasure.org/ucum.html#para-30"
    },
    "name": "Humdity Thing 2",
    "observationType":"http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
    "description": "Air humidity outdoor",
    "Thing": {"@iot.id": 2},
    "ObservedProperty": {"@iot.id": 2},
    "Sensor": {"@iot.id": 2}
}' "$HOST/Datastreams"

# ----------------------------------------
# Things(1) Sensors(1) Datastreams(4)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "unitOfMeasurement": {
        "symbol": "°C",
        "name": "degree Celsius",
        "definition": "http://unitsofmeasure.org/ucum.html#para-30"
    },
    "name": "Temperature thing 1",
    "observationType":"http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
    "description": "Air temperature outdoor",
    "Thing": {"@iot.id": 1},
    "ObservedProperty": {"@iot.id": 4},
    "Sensor": {"@iot.id": 1}
}' "$HOST/Datastreams"

# ----------------------------------------
# Datastreams(5)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "unitOfMeasurement": {
        "symbol": "m",
        "name": "meters",
        "definition": "http://unitsofmeasure.org/ucum.html#para-30"
    },
    "name": "Datastream 5",
    "observationType":"http://www.opengis.net/def/observationType/OGC-OM/2.0/OM_Measurement",
    "description": "Not associated yet"
}' "$HOST/Datastreams"

# FeaturesOfInterest
# ----------------------------------------
# FeaturesOfInterest(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "fetureOfInterest 1",
    "description": "description foi 1",
    "encodingType": "application/vnd.geo+json",
    "feature": {
        "type": "Point",
        "coordinates": [-114.06,51.05]
    }
}' "$HOST/FeaturesOfInterest"

# ----------------------------------------
# FeaturesOfInterest(2) Observation(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "name": "fetureOfInterest 2",
    "description": "description foi 2",
    "encodingType": "application/vnd.geo+json",
    "feature": {
        "type": "Point",
        "coordinates": [-112.06,53.05]
    },
    "Observation": {"@iot.id":1}
}' "$HOST/FeaturesOfInterest"

# Observation
# ----------------------------------------
# Observation(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "phenomenonTime": "2014-12-31T11:59:59.00+08:00",
    "result": 80.1,
    "resultTime":"2014-12-31T11:59:59.00+08:00"
}' "$HOST/Observations"

# ---------------------------------------------------
# Observation(2) FeatureOfInterest(2) Datastreaams(2)
# ---------------------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "phenomenonTime": "2014-12-31T11:59:59.00+08:00",
    "result": 90.1,
    "resultTime":"2014-12-31T11:59:59.00+08:00",
    "Datastream": {"@iot.id":2},
    "FeaturesOfInterest": {"@iot.id":2}
}' "$HOST/Observations"

# HistoricalLocation
# ----------------------------------------
# HistoricalLocation(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "time": "2014-12-31T11:59:59.00+08:00"
}' "$HOST/HistoricalLocations"

# ----------------------------------------
# HistoricalLocation(2) Thing(1) Location(1)
# ----------------------------------------
curl -X POST -H "Accept: application/json" -H "Content-Type: application/json" -d '{
    "time": "2016-12-31T11:59:59.00+08:00",
    "Location":{"@iot.id":1},
    "Thing":{"@iot.id":1}
}' "$HOST/HistoricalLocations"
