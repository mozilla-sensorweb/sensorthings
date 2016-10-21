psql -c 'drop database sensorthingsexample;' -U postgres 2> /dev/null || :
psql -c 'create database sensorthingsexample;' -U postgres 2> /dev/null || :
psql -c 'create extension postgis;' -U postgres sensorthingsexample 2> /dev/null || :
