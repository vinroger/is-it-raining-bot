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
        bot.sendMessage(msg.chat.id, "Hmm... Looks like you already sent '/start' or '/rain'. You will receiving notifications when it is raining around SUTD!").catch((err)=>{return;});;
        return;
    }
    const chatId = msg.chat.id;
    let exist = false;
    let msgdata = { 
        chatId: msg.chat.id,
        first_name: msg.chat.first_name, 
        last_name: msg.chat.last_name, 
        username: msg.chat.username, 
        timestamp: msg.date,
        replied:false
    };
    bot.sendMessage(msg.chat.id, "Hi! You will start receiving notifications when it is raining around SUTD!").catch((err)=>{return;});;
    await addDoc(usersCollectionRef, msgdata);
}   
const updateGroup = async (msg)=> {
    let isExist = await checkGroupExist(msg);
    if(isExist){

        bot.sendMessage(msg.chat.id, "Hmm... Looks like your group already sent '/start'. Your group will receiving notifications when it is raining around SUTD!").catch((err)=>{return;});;

        return;
    }
    const chatId = msg.chat.id;
    let exist = false;
    let msgdata = { 
        chatId: msg.chat.id,
        title: msg.chat.title,
        sender: msg.from.id,
        sender_name: msg.from.first_name +" " + msg.from.last_name,
        sender_username: msg.from.username,
        timestamp: msg.date,
    };
    bot.sendMessage(msg.chat.id, "Hi! You will start receiving notifications when it is raining around SUTD!").catch((err)=>{return;});;

    
    await addDoc(groupsCollectionRef, msgdata);
}
bot.onText(/\/start/, async (msg, match) => {
    if(msg.chat.type==="group"){
        try{
            await updateGroup(msg);
            return;
        } catch (err){
            bot.sendMessage(msg.chat.id, "Sorry, an error occured. Please contact @vinroger1 for fix.").catch((err)=>{return;});;
            return;
        }
        
    }
    else {
        try {
            await updatePrivateUser(msg);
        } catch (err){
            bot.sendMessage(msg.chat.id, "Sorry, an error occured. Please contact @vinroger1 for fix.").catch((err)=>{return;});;
            return;
        }
        
    }
});

bot.onText(/\/rain/, async (msg, match) => {
    if(msg.chat.type==="group"){
        try{
            await updateGroup(msg);
            return;
        } catch (err){
            bot.sendMessage(msg.chat.id, "Sorry, an error occured. Please contact @vinroger1 for fix.").catch((err)=>{return;});;
            return;
        }
        
    }
    else {
        try {
            await updatePrivateUser(msg);
        } catch (err){
            bot.sendMessage(msg.chat.id, "Sorry, an error occured. Please contact @vinroger1 for fix.").catch((err)=>{return;});;

            return;
        }
        
    }
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
});



export const telebot= bot;