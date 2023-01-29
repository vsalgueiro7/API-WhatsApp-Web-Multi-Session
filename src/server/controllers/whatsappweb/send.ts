import { Request, Response } from "express";
import * as yup from 'yup';
import { validation } from '../../shared/middlewares';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cliente } from './start';
import { Client, MessageMedia, LocalAuth } from "whatsapp-web.js";

interface ISend {
    idCliente: string | any;
    urlWebHook: string;
    number: string | any;
    type: 'Text' | 'Media' | 'Location';
    message?: string;
    fileUrl?: string;
    fileName?: string;
    quotedMessageSerialized?: string;
    latitude?: number;
    longitude?: number;
}

const phoneRegExp = /^\(?\d{2}\)?[\s-]?[\s9]?\d{4}?\d{4}$/

export const sendValidation = validation((getSchema) => ({
    body: getSchema<ISend>(yup.object().shape({
        idCliente: yup.string().required(),
        urlWebHook: yup.string().required(),
        number: yup.string().required().matches(phoneRegExp, 'Número de Telefone Invalido'),
        type: yup.mixed().oneOf(['Text', 'Media', 'Location']).required(),
        //if for texto
        message: yup.string().when('type', {
            is: 'Text',
            then: yup.string().required()
        }),
        //if for media
        fileUrl: yup.string().when('type', {
            is: 'Media',
            then: yup.string().required()
        }),
        fileName: yup.string().notRequired(),
        //if for location
        latitude: yup.number().when('type', {
            is: 'Location',
            then: yup.number().required()
        }),
        longitude: yup.number().when('type', {
            is: 'Location',
            then: yup.number().required()
        }),
        //caso tenha mensionado alguma mensagem
        quotedMessageSerialized: yup.string().notRequired(),
    })),
}));

const DelSession = async (idCliente: any, SESSION_FILE_PATH: string): Promise<void> => {

    if (cliente[idCliente]) {
        await cliente[idCliente].destroy().then(() => { }).catch((error: any) => { });
    }
    if (fs.existsSync(SESSION_FILE_PATH)) {
        fs.remove(SESSION_FILE_PATH, err => { if (err) console.error(err); });
    }
    cliente[idCliente] = '';
}


export const send = async (req: Request<{}, {}, ISend>, res: Response) => {
    const dados: ISend = {
        idCliente: req.body.idCliente,
        urlWebHook: req.body.urlWebHook,
        number: '55' + req.body.number + '@c.us',
        type: req.body.type,
        message: req.body.message,
        fileUrl: req.body.fileUrl,
        fileName: req.body.fileName,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        quotedMessageSerialized: req.body.quotedMessageSerialized,
    };

    const SESSION_FILE_PATH = path.resolve(__dirname, `sessions/session-${dados.idCliente}`);

    if (!fs.existsSync(SESSION_FILE_PATH)) {
        return res.status(400).json({
            message: 'Mensagem não enviada, Sessão não iniciada',
        });
    }

    try {

        if (! await cliente[dados.idCliente].getNumberId(dados.number)) {
            return res.status(400).json({
                errors: {
                    'body': {
                        'number': 'Número não Cadastrado no WhatsApp'
                    }
                }
            });
        }

        let content: any = '';

        if (dados.type == 'Media' && dados.fileUrl) {
            let mimetypeAccept: string[] = ['jpg', 'jpeg', 'png', 'pdf', 'mp3', 'mp4', 'mpeg', 'webp'];
            let mimetype: any;
            let attachment: any;
            const filter = await axios.get(dados.fileUrl, {
                responseType: 'arraybuffer'
            }).then(response => {
                mimetype = response.headers['content-type'];
                attachment = response.data.toString('base64');
                return { mimetype, attachment };
            }).catch((error: any) => {
                return { mimetype: null, attachment: null };
            });
            if (!filter.mimetype || !mimetypeAccept.includes(filter.mimetype.split('/')[1])) {
                return res.status(400).json({
                    errors: {
                        'body': {
                            'fileUrl': 'Algum Problema com a url enviada'
                        }
                    }
                });
            }

            content = new MessageMedia(filter.mimetype, filter.attachment, dados.fileName);

        } else if (dados.type == 'Location' && dados.latitude && dados.longitude) {
            content = `https://maps.google.com/maps?q=${dados.latitude}%2C${dados.longitude}&z=17`;
            //const gmapsUrl = `https://maps.google.com/maps?q=${dados.latitude}%2C${dados.longitude}&z=17`;
           // content = `data:image/png;base64,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`;
        } else {
            content = dados.message;
        }

        cliente[dados.idCliente].sendMessage(dados.number, content, { linkPreview: true, sendAudioAsVoice: true, caption: dados.message, quotedMessageId: dados.quotedMessageSerialized });

        return res.status(200).json({
            message: 'Mensagem Enviada',
        });

    } catch (error: any) {
        if (error.message) {
            await DelSession(dados.idCliente, SESSION_FILE_PATH);
            axios.post(dados.urlWebHook, { meId: dados.idCliente, status: 'DISCONNECTED', }).then(() => { }).catch((error: any) => { });
        }
        return res.status(500).json({
            message: 'Mensagem não enviada, Sessão não iniciada',
            response: error.message,

        });
    }

};