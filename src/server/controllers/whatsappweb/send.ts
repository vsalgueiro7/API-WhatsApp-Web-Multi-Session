import { Request, Response } from "express";
import * as yup from 'yup';
import { validation } from '../../shared/middlewares';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { cliente } from './start';

import { Client, MessageMedia, LocalAuth } from "whatsapp-web.js";

const SESSION_PATH: string = path.resolve(__dirname, 'sessions');

interface ISend {
    IdCliente: string | any;
    UrlWebHook: string;
    Number: string;
    Message: string;
    FileUrl?: string | null;
    FileNamePdf?: string | null;

}

export const sendValidation = validation((getSchema) => ({
    body: getSchema<ISend>(yup.object().shape({
        IdCliente: yup.string().required(),
        UrlWebHook: yup.string().required(),
        Number: yup.string().required(),
        Message: yup.string().required(),
        FileUrl: yup.string().notRequired(),
        FileNamePdf: yup.string().notRequired()
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
        IdCliente: req.body.IdCliente,
        UrlWebHook: req.body.UrlWebHook,
        Number: '55'+req.body.Number+'@c.us',
        Message: req.body.Message,
        FileUrl: req.body.FileUrl,
        FileNamePdf: req.body.FileNamePdf,
    };

    const SESSION_FILE_PATH = path.resolve(__dirname, `sessions/session-${dados.IdCliente}`);

    if (!fs.existsSync(SESSION_FILE_PATH)) {
        return res.status(404).json({
            message: 'Mensagem não enviada, Sessão não iniciada',
        });
    }

    try {

        if (dados.FileUrl) {
            let mimetypeAccept: string[]  = ['jpg', 'jpeg', 'png', 'pdf', 'mp3', 'mp4', 'mpeg'];
            let mimetype: any;
            let attachment: any;
            const filter = await axios.get(dados.FileUrl, {
                responseType: 'arraybuffer'
            }).then(response => {
                mimetype = response.headers['content-type'];
                attachment = response.data.toString('base64');
                return { mimetype, attachment };
            }).catch((error:any) => {
                return { mimetype, attachment };
            });

            if (filter.attachment && mimetypeAccept.includes(filter.mimetype.split('/')[1])) {

                const media = new MessageMedia(filter.mimetype, filter.attachment, dados.FileNamePdf);
                cliente[dados.IdCliente].sendMessage(dados.Number, media, { caption: dados.Message });
                return res.status(200).json({
                    message: 'Mensagem Enviada',
                });

            }
            return res.status(500).json({
                message: 'Mensagem não enviada, Algum problema com arquivo enviado',
            });

        }

        cliente[dados.IdCliente].sendMessage(dados.Number, dados.Message)

        return res.status(200).json({
            message: 'Mensagem Enviada',
        });

    } catch (error: any) {
        if (error.message == "Cannot read properties of undefined (reading 'sendMessage')" || error.message == "error is not defined") {
            await DelSession(dados.IdCliente, SESSION_FILE_PATH);
            axios.post(dados.UrlWebHook, { idCliente: dados.IdCliente, disconnected: 'DISCONNECTED', }).then(() => { }).catch((error: any) => { });
        }
        return res.status(500).json({
            message: 'Mensagem não enviada, Sessão não iniciada',
            response: error.message,

        });
    }

};