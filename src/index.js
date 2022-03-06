import * as dotenv from 'dotenv';

import { getSponsorAccount, getConnection, csrf } from './functions';
import { transactionsHendler } from './hendlers';

dotenv.config();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors')
const port = 3002;

const RESET_SECRET = process.env.RESET_SECRET || 'password';

app.use(cors());
app.options('*', cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((request, response, next) => {
    request.ipaddress = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
    next();
});

app.get('/limits', async (request, response) => {
    response.send(csrf.getLimits(request.ipaddress));
});

app.post('/reset/limit', async (request, response) => {

    if (!request.body.secret || request.body.secret !== RESET_SECRET ) {
        response.status(401);
        response.send({ error: 'unauthenticated' })
        return;
    };

    response.send({
        success: csrf.resetLimits(request.ipaddress)
    });
});

app.post('/set/limit', async (request, response) => {

    if (typeof request.body.amount !== 'number') {
        response.status(400);
        response.send({ error: 'amount param should be number' })
        return;
    };

    if (!request.body.secret || request.body.secret !== RESET_SECRET ) {
        response.status(401);
        response.send({ error: 'unauthenticated' })
        return;
    };

    response.send({
        success: csrf.setLimit(request.body.amount)
    });
});

app.get('/csrf', async (request, response) => {
    response.send({ token: csrf.register(request.ipaddress) });
});

app.post('/broadcast', async (request, response) => {
    try {
        if (!request.body.csrf_token)                    throw new Error('csrf_token param is required');
        if (typeof request.body.csrf_token !== 'string') throw new Error('csrf_token param is required');
        if (!request.body.transactions)                  throw new Error('transactions param is required');
        if (!Array.isArray(request.body.transactions))   throw new Error('transactions param should be array');
        if (request.body.transactions.length === 0)      throw new Error('transactions param is empty');

        response.send(await transactionsHendler(request.body.transactions, request.body.csrf_token, request.ipaddress));         
    } catch (error) {
        console.log('\x1b[41m%s\x1b[0m', `[ ERROR ]`, error.message);
        response.send({ error: error.message });
    };
});

app.listen(port, (err) => {
    if (err) { return console.log('something bad happened', err) };
    console.log('\x1b[32m%s\x1b[0m', `[ SERVER STARTED  ]`, `on ${port} port`);

    const sponsorAccount = getSponsorAccount();
    const connection     = getConnection();

    connection.getBalance(sponsorAccount.publicKey).then((balance)=> {
        console.log('\x1b[32m%s\x1b[0m', `[ SPONSOR BALANCE ]`, `${balance / 1000000000} VLX` );
    });
});