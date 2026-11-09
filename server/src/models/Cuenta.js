import mongoose from 'mongoose';

const cuentaSchema = new mongoose.Schema(
  {
    numeroCuenta: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: /^[A-Za-z0-9-]{3,30}$/,
    },
    titular: { type: String, required: true, trim: true, maxlength: 80 },
    // Saldo en céntimos (entero). Nunca puede ser negativo.
    saldoCentavos: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El saldo no puede ser negativo.'],
      validate: { validator: Number.isInteger, message: 'El saldo debe ser un entero en céntimos.' },
    },
    moneda: { type: String, default: 'PEN' },
  },
  { timestamps: true }
);

export const Cuenta = mongoose.model('Cuenta', cuentaSchema);
