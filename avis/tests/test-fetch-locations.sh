#!/bin/bash
output_directory="/tmp/puppeteer/avis/output"

node ../fetch-locations.js \
    'https://localhost/{{"agencies":[{"agency_name":"London City Airport","agency_postcode":"E162PX"},{"agency_name":"Newcastle City Centre","agency_postcode":"NE47JL"},{"agency_name":"Bristol Temple Meads Train Station - United Kingdom","agency_postcode":"BS12PY"}], "days":[1,3,7,28]}}' \
    "avis.co.uk" \
    "UID" \
    "$output_directory" \
    "rentals_search"