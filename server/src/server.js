import 'dotenv/config';
import { crearApp } from './app.js';
import { conectarDB, desconectarDB } from './config/db.js';

const PORT = Number(process.env.PORT) || 5000;

try {
  await conectarDB();
  console.log('✔ Conectado a MongoDB');
} catch (error) {
  console.error('✖ No se pudo conectar a MongoDB. ¿Está iniciado el servicio local (mongod)?');
  console.error(`  ${error.message}`);
  process.exit(1);
}

const servidor = crearApp().listen(PORT, () => {
  console.log(`✔ API escuchando en http://localhost:${PORT}`);
});

const cerrar = async () => {
  servidor.close();
  await desconectarDB();
  process.exit(0);
};
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
