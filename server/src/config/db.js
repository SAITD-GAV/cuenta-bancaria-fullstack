import mongoose from 'mongoose';

const URI_POR_DEFECTO = 'mongodb://127.0.0.1:27017/cuenta_bancaria';

export async function conectarDB(uri = process.env.MONGODB_URI || URI_POR_DEFECTO) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  return mongoose.connection;
}

export async function desconectarDB() {
  await mongoose.disconnect();
}
