var geocoderProvider = 'google';
var httpAdapter = 'https';
// optional
var extra = {
    apiKey: 'AIzaSyBvj8SpoB4NZUNdmkNVEi183ydjBEC6ENQ', // for Mapquest, OpenCage, Google Premier
    formatter: null         // 'gpx', 'string', ...
};

var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter, extra);

var giveGeo = function giveGeo(data){

    return geocoder.geocode(data)

};

module.exports = giveGeo;

/*
// output :
[{
    latitude: 48.8698679,
    longitude: 2.3072976,
    country: 'France',
    countryCode: 'FR',
    city: 'Paris',
    zipcode: '75008',
    streetName: 'Champs-Élysées',
    streetNumber: '29',
    administrativeLevels:
     { level1long: 'Île-de-France',
       level1short: 'IDF',
       level2long: 'Paris',
       level2short: '75' }
}]
*/