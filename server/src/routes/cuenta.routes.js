import { Router } from 'express';
import {
  depositar,
  listarCuentas,
  obtenerCuenta,
  obtenerHistorial,
  retirar,
  transferir,
} from '../controllers/cuenta.controller.js';

const router = Router();

router.get('/', listarCuentas); //                    Lista de cuentas (extra, para los selectores)
router.post('/deposito', depositar); //               Registra un depósito
router.post('/retiro', retirar); //                   Registra un retiro
router.post('/transferencia', transferir); //         Registra la transferencia entre cuentas
router.get('/:id', obtenerCuenta); //                 Obtiene saldo y datos de la cuenta
router.get('/:id/historial', obtenerHistorial); //    Obtiene el registro de transacciones

export default router;
