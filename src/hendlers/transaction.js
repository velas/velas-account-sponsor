import bs58 from 'bs58';
import * as dotenv from 'dotenv';
import { PublicKey, sendAndConfirmRawTransaction } from '@velas/web3';
import nacl from 'tweetnacl';

import { transactionSetSigners, messageToTransaction, getSponsorAccount, getConnection, csrf } from '../functions';
import { airdropHendler } from '../hendlers'

dotenv.config();

const transactionsHendler = async ( transactions, csrf_token, ip) => {
    const connection     = getConnection();
    const sponsorAccount = getSponsorAccount();

    let transactions_length     = transactions.length;
    let transactions_sent       = 0;
    let transactions_signatures = [];

    for (const { message, signatures } of transactions) {
        const n = `[ ${transactions_sent + 1}/${transactions_length} ]`;

        console.log('\x1b[44m%s\x1b[0m', `[ START BROADCASTING ] ${n}`);
        
        csrf.verify(csrf_token, ip);

        if (!Array.isArray(signatures)) throw new Error(`signatures param of transaction ${n} should be array`);

        const transactionWithoutSigners = messageToTransaction(message, n);
        const transaction               = transactionSetSigners(transactionWithoutSigners, n);

        try {
            const payerPubKey   = transaction.feePayer.toBase58();
            const sponsorPubKey = sponsorAccount.publicKey.toBase58();

            if (payerPubKey !== sponsorPubKey) throw new Error(`Expected ${sponsorPubKey} but got ${payerPubKey}`);

            transaction.sign(sponsorAccount);
        } catch (error) {
            throw new Error(`Invalid sponsor (payer) for transaction ${n}. ${error.message}`)
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

        for (const { signature, publicKey } of transaction.signatures) {
            if (signature) {

                const valid = nacl.sign.detached.verify(transaction.serializeMessage(), signature, publicKey.toBuffer())

                if (!valid) {
                    console.log('\x1b[41m%s\x1b[0m', `[ VALIDATION ]`, `invalid signature for publicKey: ${publicKey.toBase58()}`);
                }
            } else {
                console.log('\x1b[41m%s\x1b[0m', `[ VALIDATION ]`, `no signature for: ${publicKey.toBase58()}`);
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

        await airdropHendler(transaction, n);

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

export default transactionsHendler;