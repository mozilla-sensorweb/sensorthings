/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import resource from './resource';
import {
  excludedFields,
  sensors
} from '../constants';

/**
 * Implementation of 8.2.5 "Sensor"
 * The OGC SensorThings API follows the ITU-T definition, i.e., with regard
 * to the Internet of Things, a thing is an object of the physical world
 * (physical things) or the information world (virtual things) that is capable
 * of being identified and integrated into communication networks
 * [ITU-T Y.2060].
 *
 * Response: A list of all entities (with all the properties) in the specified
 * entity set when there is no service-driven pagination imposed. The response
 * is represented as a JSON object containing a name/value pair named value.
 * The value of the value name/value pair is a JSON array where each element
 * is representation of an entity or a representation of an entity reference.
 * An empty collection is represented as an empty JSON array.
 *
 * Each element SHALL be a JSON object with at least two name/value pairs,
 * one with name 'name' containing the name of the entity set (e.g., Things,
 * Locations, Datastreams, Observations, ObservedProperties and Sensors)
 * and one with name 'url' containing the URL of the entity set, which may be
 * an absolute or a relative URL.
 * Example Request:
 * http://example.org/v1.0/Sensors
 *
 * Example Response:
 * {
 *   "@iot.count":84,
 *   "value": [
 *    {
 *      "@iot.id": 1,
 *      "@iot.selfLink": "http://example.org/v1.0/Sensors(1)",
 *      "Datastreams@iot.navigationLink": "Sensors(1)/Datastreams",
 *      "description": "TMP36 - Analog Temperature sensor",
 *      "encodingType": "application/pdf",
 *      "metadata": "http://example.org/TMP35_36_37.pdf"
 *      {...}
 *    }
 *    ]
 *    "@iot.nextLink":
 *      "http://example.org/v1.0/ObservedProperties?$top=5&$skip=5"
 * }
 **/

const endpoint = sensors;

module.exports = function sensorsRouter(version) {
  return resource(endpoint, excludedFields, version);
}
