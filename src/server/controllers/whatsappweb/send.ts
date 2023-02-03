import { Request, Response } from "express";
import * as yup from 'yup';
import { validation } from '../../shared/middlewares';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cliente } from './start';
import { Client, MessageMedia, Buttons} from "whatsapp-web.js";

interface ISend {
    idCliente: string | any;
    urlWebHook: string;
    number: string | any;
    type: 'Text' | 'Media' | 'Location' | 'Buttons';
    message?: string;
    fileUrl?: string;
    fileName?: string;
    quotedMessageSerialized?: string;
    latitude?: number;
    longitude?: number;
    title?: string;
    footer?: string;
    buttonsArray?: Array<{body: string }>;
}

const phoneRegExp = /^\(?\d{2}\)?[\s-]?[\s9]?\d{4}?\d{4}$/

export const sendValidation = validation((getSchema) => ({
    body: getSchema<ISend>(yup.object().shape({
        idCliente: yup.string().required(),
        urlWebHook: yup.string().required(),
        number: yup.string().required().matches(phoneRegExp, 'Número de Telefone Invalido'),
        type: yup.mixed().oneOf(['Text', 'Media', 'Location', 'Buttons']).required(),
        //if for texto
        message: yup.string().when('type', {
            is: 'Text' || 'Buttons',
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
        title: yup.string().when('type', {
            is: 'Buttons',
            then: yup.string().required()
        }),

        footer: yup.string().notRequired(),

        buttonsArray: yup.array().when('type', {
            is: 'Buttons',
            then: yup.array().required()
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
        title: req.body.title,
        footer: req.body.footer,
        buttonsArray: req.body.buttonsArray

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
            content = `https://www.google.com/maps?q=${dados.latitude},${dados.longitude}&z=17`;
           // content = new Location(dados.latitude, dados.longitude, dados.message);

        } else if (dados.type == 'Buttons' && dados.message && dados.buttonsArray) {

            // Limited to 5 buttons per message and limited to 3 buttons for each kind, in this case the third quick reply button will be removed
            content = new Buttons(
                dados.message,
                dados.buttonsArray,
                dados.title,
                dados.footer
            );

        }
        else {
            content = dados.message;
        }

        cliente[dados.idCliente].sendMessage(dados.number, content, { linkPreview: true, caption: dados.message, quotedMessageId: dados.quotedMessageSerialized });

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