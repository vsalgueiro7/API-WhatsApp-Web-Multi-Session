import axios from 'axios';
import { Message, MessageId } from "whatsapp-web.js";
import { join } from "path";
import { writeFile } from "fs";
import fs from 'fs-extra';
import { promisify } from "util";

const writeFileAsync = promisify(writeFile);

interface IMessageData {
    notifyName?: string
}

export interface IMessageId extends MessageId {
    participant?: string
}

export interface IMessage extends Message {
    id: IMessageId,
    _data?: IMessageData
}

const isValidMsg = (msg: IMessage): boolean => {
    if (msg.from === "status@broadcast") return false;
    if (
        msg.type === "chat" ||
        msg.type === "audio" ||
        msg.type === "ptt" ||
        msg.type === "video" ||
        msg.type === "image" ||
        msg.type === "document" ||
       // msg.type === "sticker" || //(figurinha )
        msg.type === "location"  //Localiczação
        // msg.type === "vcard" || ( anexo de numero de contato)
        // msg.type === "call_log" || ( ligação )
        //  msg.type === "e2e_notification" || // Ignore Empty Messages Generated When Someone Changes His Account from Personal to Business or vice-versa
        // msg.type === "notification_template" || // Ignore Empty Messages Generated When Someone Changes His Account from Personal to Business or vice-versa
    ) {
        if (!msg.author && // Ignore Group Messages
            !msg.id.participant // Ignore Group Messages
        ) {
            return true;
        }

    }

    return false;
};

const Treatment = async (msg: IMessage) => {

    const dados: object = {
        type: msg.type,
        formMe: msg.fromMe,
        notifyName: msg._data?.notifyName,
        idMenssage: msg.id.id,
        _serialized: msg.id._serialized,
        from: msg.from,
        to: msg.to,
        dateMessage: msg.timestamp,
        hasQuotedMsg: msg.hasQuotedMsg
    };

    let newDados: object = {};
    if (msg.type === 'chat'  ) {
        newDados = {
            body: msg.body
        };
    }
    if (msg.type === 'image' || msg.type === "audio" || msg.type === "ptt" || msg.type === "video" || msg.type === "document") {
        const media = await msg.downloadMedia();
        if (media){
            newDados = {
                body:msg.body,
                mimetype: media.mimetype,
                base64: media.data,
                filename: media.filename
           };
        }
    }
    if(msg.type === 'location'){
        newDados = {
            body:msg.body,
            latitude: msg.location.latitude,
            longitude: msg.location.longitude,
            description: msg.location.description,
       };
    }

    return Object.assign(dados, newDados);

}

export const ReceiveOrFromMeMessages = async (idCliente: string | any, urlWebHook: string, msg: IMessage): Promise<void> => {

    if (!isValidMsg(msg)) return;

    let dados = await Treatment(msg);

    axios.post(urlWebHook, { meId: idCliente, msg: dados, }).then(() => { }).catch((error: any) => { });
}

