#!/bin/bash
set -e
echo $PWD

BASE_PATH=$PWD
# Read file from TE_BASE/users/travis/s000x/html/name
str1="testMethodStatusFAIL"
files="$BASE_PATH/test/TE_BASE/users/travis/s0001/html"
echo $files

if grep "$str1" $files/sta10-0.8-SNAPSHOT_Conformance\ Level\ *.html; then
  echo "There are failures in OGC tests"
  exit 1
else 
  echo "There are not failures in OGC tests"
fi
