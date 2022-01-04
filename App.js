

import fetch from 'node-fetch';
import {telebot} from "./src/Telegram.js"
import dotenv from "dotenv";
import {
    db,
    usersCollectionRef, 
    orderedUsersCollectionRef, 
    groupsCollectionRef, 
    orderedGroupsCollectionRef 
} from "./src/firebase.js";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from "firebase/firestore";
dotenv.config();

//GLOBALS
let stationReading = {
    S224 : 0,
    S24 : 0,
    S207 : 0,
    S106 : 0,
    S94 : 0,
    S84: 0,
    S212: 0,
    S208: 0,
};
let rainSwitch = false;
let jobInterval = null;
let checkRainInterval= setInterval(checkRain, 3000);

async function isRaining(){
    let req = await fetch('https://api.data.gov.sg/v1/environment/rainfall');
    //let req = await fetch('https://api.data.gov.sg/v1/environment/rainfall?date_time=2021-11-27T18%3A00%3A00');
    let data = await req.json()
    let boolCheckRain = false;
    stationReading = {
        S224 : 0,
        S24 : 0,
        S207 : 0,
        S106: 0,
        S94: 0,
        S84: 0,
        S212: 0,
        S208: 0,
    };
    data.items[0].readings.forEach(function(reading){
        if(reading.station_id === "S224" ) {
            boolCheckRain = Boolean(boolCheckRain || reading.value);
            stationReading.S224 = reading.value;
        }
        if(reading.station_id === "S24"){
            boolCheckRain = Boolean(boolCheckRain || reading.value);
            stationReading.S24 = reading.value;
        }
        if(reading.station_id === "S207"){
            boolCheckRain = Boolean(boolCheckRain || reading.value);
            stationReading.S207 = reading.value;
        }
        if(reading.station_id === "S106"){
            boolCheckRain = Boolean(boolCheckRain || reading.value);
            stationReading.S106 = reading.value;
        }
        if(reading.station_id === "S94"){
            boolCheckRain = Boolean(boolCheckRain || reading.value);
            stationReading.S94 = reading.value;
        }
        if(reading.station_id === "S84"){
            boolCheckRain = Boolean(boolCheckRain || reading.value);
            stationReading.S84 = reading.value;
        }
        if(reading.station_id === "S212"){
            boolCheckRain = Boolean(boolCheckRain || reading.value);
            stationReading.S212 = reading.value;
        }
        if(reading.station_id === "S208"){
            boolCheckRain = Boolean(boolCheckRain || reading.value);
            stationReading.S208 = reading.value;
        }
    })
    return boolCheckRain;
}

async function informRain(){
    try{
        clearInterval(jobInterval);
    }
    catch (err){
        console.log(err);
    }
    jobInterval=setInterval(sendMessage, 3000);
}

async function fetchId(){
    const userData = await getDocs(orderedUsersCollectionRef);
    //console.log(userData);
    const userId = userData.docs.map((user)=> {
        //console.log("USER", user.data());
        const singleData = user.data();
        if(singleData.replied) return;
        return singleData.chatId;
    });
    const groupData = await getDocs(orderedGroupsCollectionRef);
    const groupId = groupData.docs.map((group)=> {
        const singleData = group.data();
        if(singleData.replied) return;
        return singleData.chatId;
    });
    return [...userId, ...groupId];
}

async function sendMessage(){
    let userId = await fetchId();
    //console.log(userId);
    userId.forEach((id)=>{
        if(!id) return;
       // console.log(id);
        let message = "**It is raining now!**\nDon't forget to close your window!\n\nThe reading is as described below:\n" +
        "Sensor S24  (Upper Changi Rd N)    : "+ stationReading.S24 +"\n" +
        "Sensor S224 (Changi Airport)       : "+ stationReading.S224 +"\n" +
        "Sensor S207 (Singapore Expo)       : "+ stationReading.S207 +"\n" +
        "Sensor S94 (Pasir Ris St 51)       : "+ stationReading.S94 +"\n" +
        "Sensor S84 (Simei Avenue)          : "+ stationReading.S84 +"\n" +

        "Sensor S212 (Bedok S Road)         : "+ stationReading.S212 +"\n" +
        "Sensor S208 (Tanah Merah)          : "+ stationReading.S208 +"\n" +

        "Sensor S106 (Pulau Ubin)           : "+ stationReading.S106 +"\n" +
        "\nIf you closed your window already send /stop. \nYou will be receiving notifications again in the next rain every 5 minutes."; 
        telebot.sendMessage(id, message).catch((err)=>{return;});
        
    });
}

async function resetReplied(){
    const userData = await getDocs(orderedUsersCollectionRef);
    userData.docs.forEach( async (eachDoc)=> {
        const userDoc = doc(db, "users", eachDoc.id);
        const newFields = { replied:false };
        await updateDoc(userDoc, newFields);
    });
    const groupData = await getDocs(orderedGroupsCollectionRef);
    groupData.docs.forEach( async (eachDoc)=> {
        const userDoc = doc(db, "groups", eachDoc.id);
        const newFields = { replied:false };
        await updateDoc(userDoc, newFields);
    });

}

async function checkRain(){
    //console.log(rainSwitch);
    let boolIsRaining = await isRaining();
    //boolIsRaining = true;
    if (boolIsRaining){
        if(rainSwitch) return;
        else {
            rainSwitch = true;
            informRain();
        }
    }
    else{
        if(rainSwitch) {
            rainSwitch = false;
            resetReplied();
        }
        else{
            return;
        }
    }
}

// async function informRain(){
//     let isRaining = await fetchData();
//     console.log(isRaining);
//     await telebot.sendMessage(1707158311, isRaining? "It is raining " + station: "It is not raining");
// }

// setInterval(informRain, 3000);



