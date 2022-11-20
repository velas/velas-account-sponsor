import * as dotenv from 'dotenv';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

import { getSponsorAccount, getConnection, csrf } from './functions';
import { transactionsHendler, historyHendler } from './hendlers';

dotenv.config();

if (!process.env.SPONSOR_PRIVATE || !process.env.NETWORK_HOST || !process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS) {
    const keyPair = nacl.sign.keyPair();
    const secret = bs58.encode (new Uint8Array(keyPair.secretKey));

    console.log('\x1b[41m%s\x1b[0m', `[ SERVER SETUP ]`, 'Please create and set up .env file.');
    console.log('\x1b[41m%s\x1b[0m', `[ SERVER SETUP ]`, 'To get started with testnet you can use this values: \n');

    console.log('\x1b[33m%s\x1b[0m', `SPONSOR_PRIVATE="${secret}"`);
    console.log('\x1b[33m%s\x1b[0m', `NETWORK_HOST="https://api.testnet.velas.com"`);
    console.log('\x1b[33m%s\x1b[0m', `VELAS_ACCOUNT_PROGRAM_ADDRESS="VAcccHVjpknkW5N5R9sfRppQxYJrJYVV7QJGKchkQj5"\n`);
} else {
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

    app.get('/history', async (request, response) => {
        response.send({ history: historyHendler() });
    });

    app.listen(port, (err) => {
        if (err) { return console.log('something bad happened', err) };
        console.log('\x1b[32m%s\x1b[0m', `[ SERVER STARTED  ]`, `on ${port} port`);

        const sponsorAccount = getSponsorAccount();
        const connection     = getConnection();

        connection.getBalance(sponsorAccount.publicKey).then((balance)=> {
            console.log('\x1b[32m%s\x1b[0m', `[ SPONSOR BALANCE ]`, `${balance / 1000000000} VLX` );
            if ((balance / 1000000000) < 0.05) console.log('\x1b[41m%s\x1b[0m', `[ SPONSOR BALANCE ]`, `Don't forget to fund`, '\x1b[32mCURRENT SPONSOR\x1b[0m', `account! Otherwise, transactions cannot be sponsored.`,);
        });
    });
};