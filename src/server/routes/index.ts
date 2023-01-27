import { Router } from 'express';
import { WhatsappController } from '../controllers';

const router = Router();

router.post('/start',WhatsappController.startValidation, WhatsappController.start);
router.post('/send',WhatsappController.sendValidation, WhatsappController.send);

export {router};