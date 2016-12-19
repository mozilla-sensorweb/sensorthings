# OGC tests

This document provides information about how to install and configure the OGC tests

---

# Prerequisite SW

## Install Maven

Maven versions 3.2.2 and 3.2.5 have been tested and work
Download from here
```ssh
curl https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/3.2.2/apache-maven-3.2.2-bin.tar.gz > apache-maven-3.2.2.tar.gz
```

Unzip it:
```ssh
tar xzvf apache-maven-3.2.2-bin.tar.gz
```

Add the bin directory of the created directory apache-maven-3.3.2 to the PATH environment variable
```ssh
vi ~/.bash_profile
M2_HOME=/usr/local/apache-maven/apache-maven-3.2.2
export M2_HOME
source ./bash_profile
```

Confirm with mvn -v in a new shell. The result should look similar to
```ssh
Apache Maven 3.2.2 (45f7c06d68e745d05611f7fd14efb6594181933e; 2014-06-17T15:51:42+02:00)
Maven home: /Users/irios/git/sensorWeb/testsServer/apache-maven-3.2.2
Java version: 1.8.0_91, vendor: Oracle Corporation
Java home: /Library/Java/JavaVirtualMachines/jdk1.8.0_91.jdk/Contents/Home/jre
Default locale: es_ES, platform encoding: UTF-8
OS name: "mac os x", version: "10.11.6", arch: "x86_64", family: "mac"
```
IMPORTANT NOTE: Java 8 at least is required in order to configure and run the tests successfully

# Configure TEAM engine

## Download and install TE
```ssh
git clone https://github.com/opengeospatial/teamengine.git repo/teamengine
```

Build TE source:
```ssh
cd repo/teamengine
mvn install
```

This has to finish with a BUILD SUCCESS message. 
It would be necessary to unzip files generated into TE_BASE and te-install as follows in the next steps. These files will have the version of the teamengine tag used. In this case master would correspond with 4.10-SNAPSHOT.
NOTE: The branches tested have been 4.2 and master.

## Configure TE_BASE
Create a dir TE_BASE
Add to the Path
```ssh
TE_BASE=~/TE_BASE
```

In some cases it is necessary to be able to launch the tests, absolute path does not work but relative does.

Unzip the corresponding -base.zip file generated in repo/teamengine into this dir
```ssh
unzip /repo/teamengine/teamengine-console/target/teamengine-console-4.10-RC2-SNAPSHOT-base.zip .
```

## Configure te-install
At the same level than TE_BASE
Create a dir te-install and unzip the corresponding -bin.zip file generated in repo/teamengine into this dir.
```ssh
unzip ~/repo/teamengine/teamengine-console/target/teamengine-console-4.10-SNAPSHOT-bin.zip -d .
```

## Download and install sta-10 tests
Clone the repo with the tests:
```ssh
git clone https://github.com/opengeospatial/ets-sta10.git
```
Install the tests:
```ssh
cd ets-sta10
mvn clean install
```

Once the mvn finishes with BUILD SUCCESS, go to target folder and unzip the files below into the corresponding folders
```ssh
cd target
unzip  ets-sta10-0.8-SNAPSHOT-ctl.zip ~/TE_BASE/scripts
unzip ets-sta10-0.8-SNAPSHOT-deps.zip ~/TE_BASE/resources/lib
```
# Preconditions to run the tests

In order to launch the tests this precondition should be met:
```ssh
http://cite.opengeospatial.org/te2/about/sta10/1.0/site/
```
To achieve that a POST request has to be made with that data.

# Run the tests
Once the server is running and the script to populate the db has finished, it is possible to launch the tests.

## Command to run the tests
```ssh
~/te-install/bin/unix/test.sh -source=~TE_BASE/scripts/sta10/1.0/ctl/sta10-suite.ctl
```

## Command to run the tests in headless mode
```ssh
~/te-install/bin/unix/test.sh -source=~TE_BASE/scripts/sta10/1.0/ctl/sta10-suite.ctl -form=~forms/sta10.xml
```
form sta10.xml has to be created. This would be an example of it:
    ```ssh
    <?xml version="1.0" encoding="UTF-8"?>
    <values>
        <value key="uri">http://localhost:8080/v1.0</value>
        <value key="doc"></value>
        <value key="level">1</value>
    </values>
    ```

## Result of the tests
This would be a summary of the execution of the test suite:
    ```ssh
    Test suite: sta10-0.8-SNAPSHOT
          ======== Test groups ========
          Conformance Level 1
              Passed: 1 | Failed: 5 | Skipped: 0
          Conformance Level 2
              Passed: 0 | Failed: 0 | Skipped: 9
          Conformance Level 3
              Passed: 0 | Failed: 0 | Skipped: 8
    ```

The logs can be found under TE_BASE folder.
```ssh
TE_BASE/users/{userName}/{number of the execution}/html/
```
# OGC tests in travis

Maven is already installed in travis, so it is not necessary to install it.
Be aware of the jdk version installed in travis, version 8 or higher is required.

See the scripts for installing the necessary tools:
```ssh
https://github.com/isabelrios/sensorthings/blob/ogc-tests-travis/scripts/OGC_tests/install_tests.sh
```
And for launching the tests:
```ssh
https://github.com/isabelrios/sensorthings/blob/ogc-tests-travis/scripts/OGC_tests/launch_tests.sh
```
So that the test can pass, it is necessary also to set the required preconditions:
```ssh
https://github.com/mozilla-sensorweb/sensorthings/tree/master/scripts/preconditions.sh
```

# References used to get the tests working

General Instructions
```ssh
https://github.com/opengeospatial/teamengine/blob/master/doc/en/index.rst
```
Ets-sta10 preconditions
```ssh
http://cite.opengeospatial.org/te2/about/sta10/1.0/site/
```
General information about the ets-sta10 Test Suite:
```ssh
http://opengeospatial.github.io/ets-sta10/index.html
```
Example of how to add a test suite to be able to run it.
In step Installations of tests in TEAM ENGINE
```ssh
http://opengeospatial.github.io/teamengine/installation.html
```
Examples of other forms files
```ssh
https://github.com/geoserver/geoserver-cite-tools/tree/master/forms
```
Sensorthings repo
```ssh
https://github.com/mozilla-sensorweb/sensorthings
```
OGC Sensorthings API definition
```ssh
http://docs.opengeospatial.org/is/15-078r6/15-078r6.html
```
OGC sta-10 tests for each conformance level
```ssh
https://github.com/opengeospatial/ets-sta10/tree/e49d2e77cb23d6e3da33bfc1933660e6da80c5f0/src/main/java/org/opengis/cite/sta10
```
Examples of POST request for populating the db with data
```ssh
https://github.com/Geodan/gost/tree/master/test
```