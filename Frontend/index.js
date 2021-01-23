
// paste key here: please do NOT commit the API key
let PUBLISH_KEY = "";

Radar.initialize(PUBLISH_KEY);

Radar.geocode({query: '3415 West 144th St Cleveland OH'}, (err, res) => {
    console.log(err, res);
});

