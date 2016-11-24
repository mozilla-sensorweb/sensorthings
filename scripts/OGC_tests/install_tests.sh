#!/bin/bash
set -e

BASE_PATH=$PWD

echo "Installing TE Source"
git clone https://github.com/opengeospatial/teamengine.git test/teamengine

cd $BASE_PATH/test/teamengine

# Using stable branch
echo "Building TE source in $PWD"
git checkout 4.10

mvn install

echo "Preparing TE_BASE"
mkdir $BASE_PATH/test/TE_BASE

export TE_BASE=$BASE_PATH/test/TE_BASE
export PATH=$TE_BASE:$PATH

cd $TE_BASE
echo "Changed dir to $PWD"

# Copying teamengine-console-xxxx-base.zip into TE_BASE
cp $BASE_PATH/test/teamengine/teamengine-console/target/teamengine-console-4.10-base.zip .
unzip teamengine-console-4.10-base.zip

echo "Preparing te-install"
mkdir $TE_BASE/te-install
cd te-install

echo $PWD

# Copying teamengine-console-xxxx-bin.zip into TE_BASE
cp $BASE_PATH/test/teamengine/teamengine-console/target/teamengine-console-4.10-bin.zip .
unzip teamengine-console-4.10-bin.zip

cd ..

echo $PWD

echo "Downloading ets-sta10 repo"
# Download tests from repo
git clone https://github.com/opengeospatial/ets-sta10.git
cd ets-sta10

mvn clean install 

cd target

cp ets-sta10-0.8-SNAPSHOT-ctl.zip $TE_BASE/scripts
cp ets-sta10-0.8-SNAPSHOT-deps.zip $TE_BASE/resources/lib

cd $TE_BASE/scripts
unzip ets-sta10-0.8-SNAPSHOT-ctl.zip

cd $TE_BASE/resources/lib
unzip ets-sta10-0.8-SNAPSHOT-deps.zip

cd $BASE_PATH
