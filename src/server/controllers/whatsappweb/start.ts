import { Request, Response } from "express";
import * as yup from 'yup';
import { validation } from '../../shared/middlewares';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { Client, MessageMedia, LocalAuth } from "whatsapp-web.js";

export let cliente: string[] | any[] = [];
const SESSION_PATH: string = path.resolve(__dirname, 'sessions');

interface IAcesso {
    IdCliente: string | any;
    UrlWebHook: string;
}

export const startValidation = validation((getSchema) => ({
    body: getSchema<IAcesso>(yup.object().shape({
        IdCliente: yup.string().required(),
        UrlWebHook: yup.string().required()
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

const ReceiveMessages = async (idCliente: string | any, UrlWebHook: string, msg: any): Promise<void> => {

    axios.post(UrlWebHook, { idCliente: idCliente, receive_messages: msg, }).then(() => { }).catch((error: any) => { });

}

export const start = async (req: Request<{}, {}, IAcesso>, res: Response) => {
    let Count: number = 0;
    const dados: IAcesso = {
        IdCliente: req.body.IdCliente,
        UrlWebHook: req.body.UrlWebHook,
    };

    const SESSION_FILE_PATH = path.resolve(__dirname, `sessions/session-${dados.IdCliente}`);

    await DelSession(dados.IdCliente, SESSION_FILE_PATH);

    try {

        cliente[dados.IdCliente] = new Client({
            authStrategy: new LocalAuth({ clientId: dados.IdCliente, dataPath: SESSION_PATH }),
            puppeteer: {
                //  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' , //para videos windowns
                //  executablePath: '/usr/bin/google-chrome-stable' , //para videos linux
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu'],
            }
        });

        cliente[dados.IdCliente].on('qr', async (qr: string) => {
            Count++;
            if (Count == 2) {
                console.log('Desconectado por leitura de QrCode')
                await DelSession(dados.IdCliente, SESSION_FILE_PATH);
                await axios.post(dados.UrlWebHook, { idCliente: dados.IdCliente, disconnected: 'DISCONNECTED', }).then(() => { }).catch((error: any) => { });
                return false;
            }
            console.log(Count);
            axios.post(dados.UrlWebHook, { idCliente: dados.IdCliente, qrCode: qr }).then(() => { }).catch((error: any) => { });
        });

        cliente[dados.IdCliente].on('ready', () => {
            cliente[dados.IdCliente].getState().then((result: any) => {
                console.log(result);
                if (result == "CONNECTED") {
                    axios.post(dados.UrlWebHook, { idCliente: dados.IdCliente, ready: result }).then(() => { }).catch((error: any) => { });
                }
            });

        });

        cliente[dados.IdCliente].on('loading_screen', (percent: any, message: any) => {
            axios.post(dados.UrlWebHook, { idCliente: dados.IdCliente, loading_screen: message }).then(() => { }).catch((error: any) => { });
            console.log(message)
        });

        cliente[dados.IdCliente].on('auth_failure', () => {
            console.log('** O erro de autenticação regenera o QRCODE **');
        });

        cliente[dados.IdCliente].on('authenticated', () => {
            console.log('** Autenticado **');
        });

        cliente[dados.IdCliente].on('disconnected', async () => {
            console.log('Desconectado')
            await DelSession(dados.IdCliente, SESSION_FILE_PATH);
            await axios.post(dados.UrlWebHook, { idCliente: dados.IdCliente, disconnected: 'DISCONNECTED', }).then(() => { }).catch((error: any) => { });
        });

        cliente[dados.IdCliente].initialize();

        cliente[dados.IdCliente].on('message', async (msg: any) => {
            await ReceiveMessages(dados.IdCliente, dados.UrlWebHook, msg);
        });

        return res.status(200).json({
            message: 'Processo Iniciado Com Sucesso',
        });


    } catch (error) {
        return res.status(500).json({
            message: 'Não Recebido Pelo Servidor',
        });
    }

};

