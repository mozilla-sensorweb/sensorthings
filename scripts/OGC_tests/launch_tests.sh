#!/bin/bash
set -e

echo $PWD
COMMON_PATH=$PWD

echo "Launching SensorThings Test Suite tests"

# Path to te-install, TE_BASE and forms are needed
# Using relative path
$COMMON_PATH/test/TE_BASE/te-install/bin/unix/test.sh -source=sta10/1.0/ctl/sta10-suite.ctl -form=$COMMON_PATH/test/forms/sta10.xml

# Configure the dir that will be deployed to gh-pages
export SOURCE_DIR=$BASE_PATH/test/TE_BASE/users/travis/s0001/html/
export PATH=$SOURCE_DIR:$PATH

echo $SOURCE_DIR
