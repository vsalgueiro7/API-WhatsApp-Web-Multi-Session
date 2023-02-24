import { Request, Response } from "express";
import * as yup from 'yup';
import { validation } from '../../shared/middlewares';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';
import { Client, MessageMedia, LocalAuth, Message } from "whatsapp-web.js";
import { ReceiveOrFromMeMessages } from '../../shared/services/MessangeTreatment';

export let cliente: string[] | any[] = [];
const SESSION_PATH: string = path.resolve(__dirname, 'sessions');

interface IAcesso {
    idCliente: string | any;
    urlWebHook: string;
}

export const startValidation = validation((getSchema) => ({
    body: getSchema<IAcesso>(yup.object().shape({
        idCliente: yup.string().required(),
        urlWebHook: yup.string().required()
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


export const start = async (req: Request<{}, {}, IAcesso>, res: Response) => {

    let Count: number = 0;
    const dados: IAcesso = {
        idCliente: req.body.idCliente,
        urlWebHook: req.body.urlWebHook,
    };

    const SESSION_FILE_PATH = path.resolve(__dirname, `sessions/session-${dados.idCliente}`);

    await DelSession(dados.idCliente, SESSION_FILE_PATH);

    try {

        cliente[dados.idCliente] = new Client({
            authStrategy: new LocalAuth({ clientId: dados.idCliente, dataPath: SESSION_PATH }),
            puppeteer: {
                //  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' , //para videos windowns
                //executablePath: '/usr/bin/google-chrome-stable' , //para videos linux
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu'],
            }
        });

        cliente[dados.idCliente].on('qr', async (qr: string) => {
            Count++;
            if (Count == 5) {
                console.log('Desconectado por leitura de QrCode')
                await DelSession(dados.idCliente, SESSION_FILE_PATH);
                await axios.post(dados.urlWebHook, { meId: dados.idCliente, status: 'DISCONNECTED', }).then(() => { }).catch((error: any) => { });
                return false;
            }
            console.log(Count);
            axios.post(dados.urlWebHook, { meId: dados.idCliente, qrCode: qr , status: "QRCODE" }).then(() => { }).catch(async (error: any) => {
                await DelSession(dados.idCliente, SESSION_FILE_PATH);
            });
        });

        cliente[dados.idCliente].on('ready', () => {
            cliente[dados.idCliente].getState().then((result: any) => {
                console.log(result);
                if (result != "CONNECTED") {
                    axios.post(dados.urlWebHook, { meId: dados.idCliente, status: 'DISCONNECTED', }).then(() => { }).catch((error: any) => { });
                    return false;
                }
                axios.post(dados.urlWebHook, { meId: dados.idCliente, status: "CONNECTED" }).then(() => { }).catch((error: any) => { });
            });
        });

        cliente[dados.idCliente].on('loading_screen', (percent: any, message: any) => {
            axios.post(dados.urlWebHook, { meId: dados.idCliente, status: "LOADING" }).then(() => { }).catch((error: any) => { });
            console.log(message)
        });

        cliente[dados.idCliente].on('auth_failure', () => {
            console.log('** O erro de autenticação regenera o QRCODE **');
            axios.post(dados.urlWebHook, { meId: dados.idCliente, status: 'DISCONNECTED', }).then(() => { }).catch((error: any) => { });
            return false;
        });

        cliente[dados.idCliente].on('authenticated', () => {
            console.log('** Autenticado **');
        });

        cliente[dados.idCliente].on('disconnected', async () => {
            console.log('Desconectado')
            await DelSession(dados.idCliente, SESSION_FILE_PATH);
            await axios.post(dados.urlWebHook, { meId: dados.idCliente, status: 'DISCONNECTED', }).then(() => { }).catch((error: any) => { });
            return false;
        });

        cliente[dados.idCliente].initialize();

        cliente[dados.idCliente].on('message', async (msg: Message) => {
            await ReceiveOrFromMeMessages(dados.idCliente, dados.urlWebHook, msg);
        });

        cliente[dados.idCliente].on('message_create', async (msg: Message) => {
            if (msg.id.fromMe)
                await ReceiveOrFromMeMessages(dados.idCliente, dados.urlWebHook, msg);
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

