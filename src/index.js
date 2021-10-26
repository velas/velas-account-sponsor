import * as dotenv from 'dotenv';
import bs58 from 'bs58';
import { Connection, PublicKey, Account, Transaction, Message, sendAndConfirmRawTransaction } from '@velas/web3';

import CSRF from './csrf'

dotenv.config();

const csrf = new CSRF();

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors')
const port = 3002;

const connection = new Connection(process.env.NETWORK_HOST, 'singleGossip');

app.use(cors());
app.options('*', cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const transactionSetSigners = (transaction, n) => {

    if (!transaction.instructions || !Array.isArray(transaction.instructions)) throw new Error(`no instructions in transaction ${n}`);

    for (const instruction of transaction.instructions) {

        let instructionProgrammAddress;
        let instructionNumber;

        try {
            instructionProgrammAddress = instruction.programId.toBase58();
            instructionNumber          = instruction.data[0];
        } catch (error) {
            throw new Error(`wrong instruction program address or instruction number in transaction ${n}`);
        };

        console.log('\x1b[33m%s\x1b[0m', `sponsoring instruction:`, `${instructionProgrammAddress}:${instructionNumber}`);
       
        switch(`${instructionProgrammAddress}:${instructionNumber}`) {

            case `11111111111111111111111111111111:2`:  // SystemProgram transfer 
                instruction.keys[0].isSigner = true;
                break;
            
            case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${0}`: // VelasAccountProgram initialaze
                instruction.keys[1].isSigner = true;
                break;
            
            case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${18}`: // VelasAccountProgram addProgram
                instruction.keys[7].isSigner = true;
                break;
            
            case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${2}`: // VelasAccountProgram addOperational
                instruction.keys[8].isSigner = true;
                break;

            case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${5}`: // VelasAccountProgram replaceOwner
                instruction.keys[2].isSigner = true;
                instruction.keys[3].isSigner = true;
                break;
            
            case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${19}`: // VelasAccountProgram removeProgramPermission
                instruction.keys[3].isSigner = true;
                break;

            case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${7}`: // VelasAccountProgram removeOperational
                instruction.keys[6].isSigner = true;
                break;

            case `${process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS}:${3}`: // VelasAccountProgram extendOperationalScopes
                instruction.keys[5].isSigner = true;
                break;

            default:
                throw new Error(`Instruction ${instructionProgrammAddress}:${instructionNumber} is not supported by sponsor.`);
        };  
    };

    return transaction;
};

const messageToTransaction = (message, n) => {
    if (!message)                    throw new Error('message param is required');
    if (typeof message !== 'string') throw new Error('message param should be Base58 string');

    let decoded;

    try {
        decoded = bs58.decode(message);
    } catch (error) {
        throw new Error(`message ${n} param isn't Base58 string`);
    };

    try {
        return Transaction.populate(Message.from(decoded), []);
    } catch (error) {
        throw new Error(`message ${n} isn't converted to a transaction`);
    };
};

const getSponsorAccount = () => {
    try {
        const sponsor = new Account(bs58.decode(process.env.SPONSOR_PRIVATE));
        console.log('\x1b[32m%s\x1b[0m', `[ CURRENT SPONSOR ]`, `${sponsor.publicKey.toBase58()}`)
        return sponsor;
    } catch (error) {
        throw new Error('Wrong env variable: SPONSOR_PRIVATE');
    };
};

const sponsorAccount = getSponsorAccount();

const transactionsHendler = async (transactions, csrf_token) => {

    let transactions_length     = transactions.length;
    let transactions_sent       = 0;
    let transactions_signatures = [];

    for (const { message, signatures } of transactions) {
        const n = `[ ${transactions_sent + 1}/${transactions_length} ]`;

        console.log('\x1b[44m%s\x1b[0m', `[ START BROADCASTING ] ${n}`);
        
        csrf.verify(csrf_token);

        if (!Array.isArray(signatures)) throw new Error(`signatures param of transaction ${n} should be array`);

        const transactionWithoutSigners = messageToTransaction(message, n);
        const transaction               = transactionSetSigners(transactionWithoutSigners, n);

        try {
            const payerPubKey   = transaction.feePayer.toBase58();
            const sponsorPubKey = sponsorAccount.publicKey.toBase58();

            if (payerPubKey !== sponsorPubKey) throw new Error(`Expected ${sponsorPubKey} but got ${sponsorPubKey}`);

            transaction.sign(sponsorAccount);
        } catch (error) {
            throw new Error(`Invalid sponsor for transaction ${n}. ${error.message}`)
        };

        for (const [publicKeyBase58, signatureBase58] of signatures) {
            try {
                if (typeof publicKeyBase58 !== 'string') throw new Error('No public key.');
                if (typeof signatureBase58 !== 'string') throw new Error('No signature.');

                const publicKey = new PublicKey(bs58.decode(publicKeyBase58));
                const signature = bs58.decode(signatureBase58);

                transaction.addSignature(publicKey, signature);
            } catch (error) {
                throw new Error(`Problem with adding a signature to transaction ${n}. ${error.message}`);
            };
        };

        if (!transaction.verifySignatures()) {
            throw new Error(`No required signatures for transaction ${n}`);
        };

        const signature = await sendAndConfirmRawTransaction(
            connection,
            transaction.serialize(),
            {
                commitment: 'single',
                skipPreflight: true,
            },
        );

        transactions_signatures.push(signature);
        transactions_sent = transactions_sent + 1;
        console.log('\x1b[44m%s\x1b[0m', `[ Success ]`);
    };

    return {
        transactions_length,
        transactions_sent,
        transactions_signatures,
    };
};

app.get('/csrf', async (request, response) => {
    response.send({ token: csrf.register() });
});

app.post('/broadcast', async (request, response) => {
    try {
        if (!request.body.csrf_token)                    throw new Error('csrf_token param is required');
        if (typeof request.body.csrf_token !== 'string') throw new Error('csrf_token param is required');
        if (!request.body.transactions)                  throw new Error('transactions param is required');
        if (!Array.isArray(request.body.transactions))   throw new Error('transactions param should be array');
        if (request.body.transactions.length === 0)      throw new Error('transactions param is empty');

        response.send(await transactionsHendler(request.body.transactions, request.body.csrf_token));         
    } catch (error) {
        console.log('\x1b[41m%s\x1b[0m', `[ ERROR ]`, error.message);
        response.send({ error: error.message });
    };
});

app.listen(port, (err) => {
    if (err) { return console.log('something bad happened', err) };
    console.log('\x1b[32m%s\x1b[0m', `[ SERVER STARTED  ]`, `on ${port} port`)

    connection.getBalance(sponsorAccount.publicKey).then((balance)=> {
        console.log('\x1b[32m%s\x1b[0m', `[ SPONSOR BALANCE ]`, `${balance / 1000000000} VLX` );
    });
});