psql -c 'drop database sensorthingstest;' -U postgres 2> /dev/null || :
psql -c 'create database sensorthingstest;' -U postgres 2> /dev/null || :
psql -c 'create extension postgis;' -U postgres sensorthingstest 2> /dev/null || :
