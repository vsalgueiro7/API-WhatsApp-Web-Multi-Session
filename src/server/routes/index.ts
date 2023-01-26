import { Router } from 'express';
import { WhatsappController } from '../controllers';

const router = Router();

router.post('/start',WhatsappController.createValidation, WhatsappController.create);


export {router};