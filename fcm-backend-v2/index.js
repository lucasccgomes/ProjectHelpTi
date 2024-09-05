import express from 'express';
import bodyParser from 'body-parser';
import net from 'net';
import cors from 'cors';
import { google } from 'googleapis';
import fetch from 'node-fetch';
import crypto from 'crypto';


const app = express();

// Permitir CORS apenas para o domínio específico
const corsOptions = {
    origin: 'https://drogalira.com.br', // Adicione o domínio que você quer permitir
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200 // Algumas versões antigas de navegadores podem ter problemas com status 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Habilita preflight para todas as rotas

app.use(bodyParser.json());

// Função para remover acentos e caracteres especiais
function removeAccents(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Ç/g, "C").replace(/ç/g, "c");
}

// Rota de Impressão
app.post('/api/print', (req, res) => {
    const { numSolicite, loja, cidade, user, itens } = req.body;

    console.log('Recebendo solicitação de impressão...');
    console.log('Dados recebidos para impressão:', { numSolicite, loja, cidade, user, itens });

    // Remover acentos e caracteres especiais
    const lojaSemAcentos = removeAccents(loja);
    const cidadeSemAcentos = removeAccents(cidade);
    const userSemAcentos = removeAccents(user);

    // Comandos ZPL
    let zpl = "^XA\n"; // Inicia o ZPL

    // Adiciona o cabeçalho da solicitação com tamanho de texto ajustado
    zpl += `^FO50,50^A0N,50,50^FDSolicitacao: ${numSolicite}^FS\n`;
    zpl += `^FO50,110^A0N,90,80^FDLoja: ${lojaSemAcentos}^FS\n`;
    zpl += `^FO50,200^A0N,50,60^FDCidade: ${cidadeSemAcentos}^FS\n`;
    zpl += `^FO50,260^A0N,40,40^FDUsuario: ${userSemAcentos}^FS\n`;

    // Adiciona itens
    let positionY = 320;
    for (const [itemNome, quantidade] of Object.entries(itens)) {
        const itemNomeSemAcentos = removeAccents(itemNome);
        zpl += `^FO50,${positionY}^A0N,30,30^FDItem: ${itemNomeSemAcentos} Qtd: ${quantidade}^FS\n`;
        positionY += 60; // Ajusta a posição Y para cada item
    }

    // Finaliza a etiqueta
    zpl += "^XZ";

    console.log('Conteúdo a ser impresso (ZPL):\n', zpl);

    const client = new net.Socket();
    let responseSent = false;

    client.connect(9100, '192.168.0.251', () => {
        console.log('Conectado à impressora! Enviando dados de impressão...');
        client.write(zpl); // Envia o conteúdo de impressão formatado em ZPL
        client.end(); // Fecha a conexão explicitamente após enviar
    });

    client.on('data', (data) => {
        console.log('Resposta da impressora:', data.toString());
    });

    client.on('error', (err) => {
        console.error('Erro ao se comunicar com a impressora:', err.message);
        if (err.code === 'ECONNRESET') {
            console.log('Conexão resetada pela impressora. Isso pode ser normal.');
            if (!responseSent) {
                res.status(200).send({ message: 'Impressão enviada com sucesso.' });
                responseSent = true;
            }
        } else {
            if (!responseSent) {
                res.status(500).send({ message: 'Erro ao enviar impressão para a impressora.', error: err.message });
                responseSent = true;
            }
        }
    });

    client.on('close', () => {
        console.log('Conexão com a impressora encerrada.');
        if (!responseSent) {
            res.status(200).send({ message: 'Impressão enviada com sucesso.' });
            responseSent = true;
        }
    });
});

// Função para obter o token de acesso para o Firebase
const getAccessToken = async () => {
    const keys = {
        type: "service_account",
        project_id: "projecthelpti",
        private_key_id: "8d12315adf5f254fe22cde355b939d357d2d0135",
        private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCTVdZp+Y4WzWHl\nNmAOuCdb4GhiKOmehdn/w9xbE0rwpXW8M/PhKvyCsdYrXu1JyD+BgY/wqQXfilmK\nDf6aM7ilwffF4mHA3qvl3UCYxZ9l++JVRSP4a5/WVELm//xyngZkIOgZh6P1PClu\nDVKPBcseI7yMwRfevkgRQO3SsuMg23e7SgJEiN/HvrCqhiSjzryU398gWQWV9S32\nAE2RPX7P1vVHHQsMjHoxPa+xKBXOP94+bhokeBQl3TlPfNS6VtDuoL55Jb3wO/st\nxF8aDJqi5+FfswEzhs8POwD0x97gANZ4h8zTPeAYGReIPbJ6wqyZ6uiMRZ7eew0h\ny0m2RWiDAgMBAAECggEAROHszL8P3zlGe5NgdYFDZYEVTE80ahjKQvmfHDV44+l3\nkfX4H12pkLD0IHLRHZ2xkyqv0SQ0yr4z/odscUudGGIHJU0hxrpUQ7Odb891JokM\n2DDrEEnBAMOEQ9uKe0vGUSnRWZ5A2Xa3J+yynIto2z55+JSORGVR7D8e8VMRPVqo\ngZ3VuaUrvCdzoPMashCGi1seMAanmy93GMRECYG2TqTdkeklUh/69B5rA7dm8BE7\nZ9CmHdL8uarQSV9sCPyR5GZf+gCpllC/2TjNsscV2D0/OebOz1OhuQQihA9lkzgQ\nDP+qXVZ3hU5P5XGHKyPIjw+Rb+vJexS1z5vjqQv7AQKBgQDIHuZpscPJlJsKxgVQ\nN175xEY6r0VuEYuWkcI+XLzWb1bH5fZOpsX8h6dlusq3QNjcBzJFwU/lBnv0ztdG\nXZ9HKN15QYWdekFm1cxR5kL+F9M7O5oQPCgyoNie9wj/QYSGKMF4+unGQAOEazIo\nYqSi6/AspCk3Y2bjEARKkwmiaQKBgQC8ebZqyrD9Uu3GtUHm9k1VOv8pGCNNcTyn\nw/9BfOjuShUhSqL/0AIA50UEkFh3wXhKmHP+Pg0Xn2JA/eied6YRlbO6DT498jda\nYFGPcejSJ7rArxNjNnJjHB8LbkoWzsOsG8ZmUW/duQV9SsCSi0JeRrWd1SbAuP0H\nrV5L9pY+CwKBgEQK1Zb8XTCN+YVZPPdATGeqB6LuczHwf0CrwJrJl19lreD73Jpz\nc//f89fQAhr6zoFJZRt4lfyuDrl3FpUTQhPE3kDbOV4I8nHPoc/69a5FVYnfQwvg\nGF7Wd7DdF88KbM/czaOf1JqWq1t7wyseFxJaHGhhTK5LevEbQgpFIlJ5AoGBAJUz\nJJzVZ9ah12j+A/V59S4LTgKSASBFC+ci2OZWo24/Zwq7st0fJPbiHVjHi8EBfuBO\nX0RcirCwk28vkP4haW1yPJyD70nKfNcmeGo9mjkDCmuOLKLVbyfWEx1RaYU0mOGd\n+yj0PsIevaG5k0huxVMsVoljOxJFXsi9DXDE+5qRAoGBAKdhoAS2EhYul8pcQ/Jx\nuO8lWFIysFliVxsOW0qfUjYx1daP56NylIXNgT9ULuXYkOhEhOlw6ACnXH7DJvF/\nSL4LcrwxJBqJlJ0e3eRYnKeg0pg3hoqWRmzM/gav+BRA2Z+qSa6di/LJZLCHEoCL\n/sBNM/BVctmiboFeWOx+pAgk\n-----END PRIVATE KEY-----\n",
        client_email: "firebase-adminsdk-tar9u@projecthelpti.iam.gserviceaccount.com",
        client_id: "116628065987778465379",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-tar9u@projecthelpti.iam.gserviceaccount.com",
    };

    const client = new google.auth.JWT(
        keys.client_email,
        null,
        keys.private_key,
        ['https://www.googleapis.com/auth/firebase.messaging']
    );

    const token = await client.authorize();
    return token.access_token;
};

// Rota de Notificação
app.post('/send-notification', async (req, res) => {
    const { tokens, notification } = req.body;
    try {
        console.log('Recebendo solicitação de envio de notificação:', notification);
        const accessToken = await getAccessToken();

        const responses = [];
        for (const token of tokens) {
            const message = {
                notification: {
                    title: notification.title,
                    body: notification.body
                },
                webpush: {
                    notification: {
                        icon: notification.icon, // Inclui o campo icon aqui
                    },
                    fcm_options: {
                        link: notification.click_action
                    }
                },
                token: token
            };

            const response = await fetch('https://fcm.googleapis.com/v1/projects/projecthelpti/messages:send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message
                })
            });

            const data = await response.json();
            responses.push(data);
            console.log(`Notificação enviada para o token: ${token}`);
        }

        res.status(200).send(responses);
    } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        res.status(500).send({ error: 'Erro ao enviar notificação' });
    }
});

// Iniciar o servidor na mesma porta para ambas as funções
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
