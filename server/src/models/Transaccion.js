import mongoose from 'mongoose';

export const TIPOS = ['deposito', 'retiro', 'transferencia'];

const transaccionSchema = new mongoose.Schema({
  tipo: { type: String, enum: TIPOS, required: true },
  montoCentavos: { type: Number, required: true, min: 1 },
  // Depósito: sin origen. Retiro: sin destino. Transferencia: ambos.
  cuentaOrigen: { type: String, default: null, index: true },
  cuentaDestino: { type: String, default: null, index: true },
  // Saldo de cada cuenta inmediatamente DESPUÉS de la operación (para el historial).
  saldoOrigenPosterior: { type: Number, default: null },
  saldoDestinoPosterior: { type: Number, default: null },
  descripcion: { type: String, trim: true, maxlength: 120 },
  fecha: { type: Date, default: Date.now, index: true },
});

export const Transaccion = mongoose.model('Transaccion', transaccionSchema);
