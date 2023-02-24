import { Router } from 'express';
import { WhatsappController } from '../controllers';

const router = Router();

router.get('/', function (req, res) {
    res.send('Bem Vindo a API de Mensagens Do WhatsApp, Desenvolvida por Vitor Salgueiro');
});

router.post('/start', WhatsappController.startValidation, WhatsappController.start);
router.post('/send', WhatsappController.sendValidation, WhatsappController.send);

router.use(function(req, res, next) {
    res.status(404).json({message: 'Erro ao acessar a rota'});
});


export { router };