import express, { json } from 'express';
const app = express();
import routes from './routes';
const PORT = 3000;

app.use(json());
app.use(routes);

app.listen(PORT, () => {
    console.log(`Rodando na porta ${PORT}`);
});

    
    