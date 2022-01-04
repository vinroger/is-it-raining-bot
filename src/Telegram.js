import {
    db,
    usersCollectionRef, 
    orderedUsersCollectionRef, 
    groupsCollectionRef, 
    orderedGroupsCollectionRef 
} from "./firebase.js"
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
import { ref, getDownloadURL, uploadBytesResumable, deleteObject } from "firebase/storage";
import TelegramBot from 'node-telegram-bot-api';
import dotenv from "dotenv";
import { sendSingle } from "../App.js";


//TELEGRAM BOT
dotenv.config();
const token = process.env.TOKEN;
const bot = new TelegramBot(token, {polling: true});

//FIREBASE IMPORT



const checkExist = async (msg)=> {
    const data = await getDocs(orderedUsersCollectionRef);
    const usersList = (data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    let exist = false;
    usersList.forEach((user)=>{
        if (user.chatId === msg.chat.id) {
            exist = true;
            return true;
        }
    });
    if (exist){
        return true;
    }
    return false;
}
const checkGroupExist = async (msg)=> {
    const data = await getDocs(orderedGroupsCollectionRef);
    const groupsList = (data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    let exist = false;
    groupsList.forEach((group)=>{
        if (group.chatId === msg.chat.id) {
            exist = true;
            return true;
        }
    });
    if (exist){
        return true;
    }
    return false;
}


const updatePrivateUser = async (msg)=> {
    let isExist = await checkExist(msg);
    if(isExist){
        bot.sendMessage(msg.chat.id, "Hmm... Looks like you already sent '/start' or '/rain'. You will receiving notifications when it is raining around SUTD!").catch((err)=>{return;});
        return;
    }
    const chatId = msg.chat.id;
    let exist = false;
    let msgdata = { 
        chatId: msg.chat.id,
        first_name: msg.chat.first_name, 
        last_name: msg.chat.last_name? msg.chat.last_name: "N/A", 
        username: msg.chat.username, 
        timestamp: msg.date,
        replied:false
    };
    bot.sendMessage(msg.chat.id, "Hi there!\nYou will start receiving notifications when it is raining around SUTD!\n\n/check to request the weather update now.").catch((err)=>{return;});
    await addDoc(usersCollectionRef, msgdata);
}   
const updateGroup = async (msg)=> {
    let isExist = await checkGroupExist(msg);
    if(isExist){

        bot.sendMessage(msg.chat.id, "Hmm... Looks like your group already sent '/start'. Your group will receiving notifications when it is raining around SUTD!").catch((err)=>{return;});

        return;
    }
    const chatId = msg.chat.id;
    let exist = false;
    let msgdata = { 
        chatId: msg.chat.id,
        title: msg.chat.title,
        sender: msg.from.id,
        sender_name: msg.from.first_name +" " + (msg.from.last_name? msg.from.last_name: "N/A"),
        sender_username: msg.from.username,
        timestamp: msg.date,
    };
    bot.sendMessage(msg.chat.id, "Hi there!\nYou will start receiving notifications when it is raining around SUTD!\n\n/check to request the weather update now.").catch((err)=>{return;});

    
    await addDoc(groupsCollectionRef, msgdata);
}

const handleError = async(msg, err) => {
    let errMsg = "Error occurred in " + msg.chat.id
    try {
        bot.sendMessage(1707158311, "Error happened in " + msg.chat.id 
        + msg.chat.first_name + " "
        + msg.chat.last_name + " "
        + msg.chat.username + " "
        + msg.date + err)
        .catch((err)=>{return;});
    } catch {
        bot.sendMessage(1707158311, "Error happened in " + msg.chat.id 
        + msg.chat.title + " "
        + msg.from.id + " "
        + msg.from.first_name + " "+ msg.from.last_name + " " 
        + msg.from.username
        + msg.date + err)
        .catch((err)=>{return;});
    }
    
    bot.sendMessage(msg.chat.id, "Sorry, an error occured. Please contact @vinroger1 for fix.").catch((err)=>{return;});
    return;
}

bot.onText(/\/start/, async (msg, match) => {
    if(msg.chat.type==="group"){
        try{
            await updateGroup(msg);
            return;
        } catch (err){
            handleError(msg, err);
        }
        
    }
    else {
        try {
            await updatePrivateUser(msg);
        } catch (err){
            handleError(msg, err);
        }
        
    }
    sendSingle(msg.chat.id);
});

bot.onText(/\/rain/, async (msg, match) => {
    if(msg.chat.type==="group"){
        try{
            await updateGroup(msg);
            return;
        } catch (err){
            handleError(msg, err);
        }
        
    }
    else {
        try {
            await updatePrivateUser(msg);
        } catch (err){
            handleError(msg, err);
            
        }
        
    }
    sendSingle(msg.chat.id);
});
bot.onText(/\/stop/, async (msg, match) => {
    if(msg.chat.type==="group"){
        const groupData = await getDocs(orderedGroupsCollectionRef);
        groupData.docs.forEach( async (eachDoc)=> {
            let eachDocData = eachDoc.data();
            if(eachDocData.chatId === msg.chat.id){
                const userDoc = doc(db, "groups", eachDoc.id);
                const newFields = { replied:true };
                await updateDoc(userDoc, newFields);
            }
            
        });
    }
    else {
        const userData = await getDocs(orderedUsersCollectionRef);
        userData.docs.forEach( async (eachDoc)=> {
            let eachDocData = eachDoc.data();
            if(eachDocData.chatId === msg.chat.id){
                const userDoc = doc(db, "users", eachDoc.id);
                const newFields = { replied:true };
                await updateDoc(userDoc, newFields);
            }
            
        });
    }
    bot.sendMessage(msg.chat.id, "Stopped notifications.\nYour next update will start if it starts raining again.\nIf you wish to continue receiving update send /continue.").catch((err)=>{return;});
});
bot.onText(/\/continue/, async (msg, match) => {
    if(msg.chat.type==="group"){
        const groupData = await getDocs(orderedGroupsCollectionRef);
        groupData.docs.forEach( async (eachDoc)=> {
            let eachDocData = eachDoc.data();
            if(eachDocData.chatId === msg.chat.id){
                const userDoc = doc(db, "groups", eachDoc.id);
                const newFields = { replied:false };
                await updateDoc(userDoc, newFields);
            }
            
        });
    }
    else {
        const userData = await getDocs(orderedUsersCollectionRef);
        userData.docs.forEach( async (eachDoc)=> {
            let eachDocData = eachDoc.data();
            if(eachDocData.chatId === msg.chat.id){
                const userDoc = doc(db, "users", eachDoc.id);
                const newFields = { replied:false };
                await updateDoc(userDoc, newFields);
            }
            
        });
    }
    bot.sendMessage(msg.chat.id, "Continued notifications.\nIf you wish to stop receiving update until the next rain send /stop.").catch((err)=>{return;});
    sendSingle(msg.chat.id);
});

bot.onText(/\/check/, async (msg, match) => {
    sendSingle(msg.chat.id);
});



export const telebot= bot;