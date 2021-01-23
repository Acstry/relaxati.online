
// paste key here: please do NOT commit the API key
const PUBLISH_KEY = "";

let prevWait = Promise.resolve();
let requestCount = 0;

Radar.initialize(PUBLISH_KEY);

const INTERESTS = {
    OUTDOOR: 'outdoor-places',
    SCHOOLS: 'education',
    SHOPPING: 'shopping-retail',
    INFRASTRUCTURE: 'city-infrastructure',
    ARTS_ENTERTAINMENT: 'arts-entertainment',
    RELIGION: 'religion',
};

window.onload = () => findMyRoute();

async function findMyRoute(address='3415 West 144th St Cleveland OH', interests=[INTERESTS.OUTDOOR, INTERESTS.RELIGION], duration=30) {
    let remainingDuration = duration;
    // don't want to visit the same location twice
    let visitedIds = new Set();
    let visitOrder = [];
    let startCoords = await getMyCoords(address);
    while(remainingDuration > 0){
        let coords = visitOrder.length > 0 ?
            convertCoords(visitOrder[visitOrder.length - 1].location.coordinates) : startCoords;
        console.log(coords);
        let places = await getNearbyPlaces(coords, interests);
        places = places.filter(place => !visitedIds.has(place._id));
        console.log(places);
        let distances = await getAllDistances(
            coords,
            places.map(place =>
                convertCoords(place.location.coordinates)
            ),
        );
        distances = distances.map((distance, i) => {
            return {distance: distance, place: places[i]}
        });
        console.log(distances);
        distances = distances.filter(distance => distance.distance <= remainingDuration);
        if(distances.length == 0){
            break;
        }
        console.log(distances);
        let chosen = distances[Math.floor(Math.random() * distances.length)];
        remainingDuration -= chosen.distance;
        visitedIds.add(chosen.place._id);
        visitOrder.push(chosen.place);
    }
    console.log(visitOrder);
}

function convertCoords(coords){
    if(coords instanceof Array){
        return {
            latitude: coords[1],
            longitude: coords[0]
        }
    }
    return coords;
}

function getMyCoords(address){
    return new Promise((resolve, reject) => {

        Radar.geocode({query: address}, (err, res) => {
            if(!err && res.addresses[0]){
                resolve({
                    latitude: res.addresses[0].latitude,
                    longitude: res.addresses[0].longitude
                });
            }else{
                reject(err || new Error('not found'));
            }
        });

    });
}

function getNearbyPlaces(coords, interests=[INTERESTS.OUTDOOR]){
    return new Promise((resolve, reject) => {
        console.log(interests);
        Radar.searchPlaces({
            near: coords,
            radius: 1000,
            categories: interests,
            limit: 10
        }, (err, res) => {
            if(!err){
                resolve(res.places);
            }else{
                reject(err);
            }
        });

    });
}

function getDistance(origin, destination){
    return new Promise((resolve, reject) => {
        apiWait().then(() => {
            Radar.getDistance({
                origin: origin,
                destination: destination,
                modes: ['foot'],
                units: 'imperial'
            },(err, res) => {
                if(!err){
                    resolve(res.routes.foot.duration.value);
                }else{
                    reject(err);
                }
            });
        });
    });
}

function getAllDistances(origin, destinations){
    return Promise.all(destinations.map(destination => getDistance(origin, destination)));
}

//wait a second after every 10 requests so we don't hit the rate limit
function apiWait(){
    if(requestCount < 10){
        requestCount++;
        return prevWait;
     }else{
        prevWait = new Promise(resolve => {
            prevWait.then(() => {
                console.log('setting timeout');
                setTimeout(() =>{
                    console.log('done');
                    resolve();
                }, 1500);
            });
        });
        //prevWait.then(() => new Promise(res => setTimeout(1500, res)));
        requestCount = 0;
        return prevWait;
     }
}

function openForm() {
  document.getElementById("myForm").style.display = "block";
}

function closeForm() {
  document.getElementById("myForm").style.display = "none";
}
