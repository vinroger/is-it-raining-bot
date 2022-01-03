import fetch from 'node-fetch';


dotenv.config();

async function fetchData(){
    let req = await fetch('https://api.data.gov.sg/v1/environment/rainfall');
    //let req = await fetch('https://api.data.gov.sg/v1/environment/rainfall?date_time=2021-11-27T18%3A00%3A00');
    let data = await req.json()
    let checkRain = false;
    data.items[0].readings.forEach(function(reading){
        if(reading.station_id === "S224" || reading.station_id === "S207") {
            checkRain = Boolean(checkRain || reading.value);
        }
    })
    return checkRain;
}

let isRaining = await fetchData();
