#!/bin/bash
set -e

COMMON_PATH=$PWD

echo "Launching SensorThings Test Suite tests"

# Path to te-install, TE_BASE and forms are needed
# Using relative path
$COMMON_PATH/test/TE_BASE/te-install/bin/unix/test.sh -source=sta10/1.0/ctl/sta10-suite.ctl -form=$COMMON_PATH/test/forms/sta10.xml
