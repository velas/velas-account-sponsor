
import * as dotenv from 'dotenv';
import { Transaction, SystemProgram, sendAndConfirmRawTransaction } from '@velas/web3';

import { getConnection, getSponsorAccount } from '../functions';

dotenv.config();

let airdrop = Number(process.env.AIRDROP);
    airdrop = isNaN(airdrop) ? undefined : airdrop;

    if (airdrop) console.log('\x1b[32m%s\x1b[0m', `[ AIRDROP ENABLED ]`, `${airdrop} VLX for each initiated account`);

const transfer = async function(toPubkey) {
    try {
        const connection = getConnection();
        const sponsor    = getSponsorAccount();

        const { blockhash: recentBlockhash } = await connection.getRecentBlockhash();

        const transaction = new Transaction({ recentBlockhash, feePayer: sponsor.publicKey });

        const transfer = SystemProgram.transfer({
            fromPubkey: sponsor.publicKey,
            toPubkey,
            lamports: 1000000000 * Number(process.env.AIRDROP),
        });

        transaction.add(transfer);
        transaction.sign(sponsor);

        const signature = await sendAndConfirmRawTransaction(
            connection,
            transaction.serialize(),
            {
                commitment: 'single',
                skipPreflight: true,
            }
        );

        console.log('\x1b[33m%s\x1b[0m', `[ SUCCESS AIRDROP ]`, toPubkey.toBase58(), 'amount', signature);
    } catch (e) {
        console.log('\x1b[33m%s\x1b[0m', `[ ERROR AIRDROP ]`, toPubkey.toBase58(), e.message);
        throw new Error(e.message);
    }
};

const airdropHendler = async (transaction, n) => {

    if (airdrop) {
        if (!transaction.instructions || !Array.isArray(transaction.instructions)) throw new Error(`no instructions in transaction ${n}`);

        const instruction = transaction.instructions[1];

        if (!instruction) return;

        let instructionProgrammAddress;
        let instructionNumber;

        try {
            instructionProgrammAddress = instruction.programId.toBase58();
            instructionNumber          = instruction.data[0];
        } catch (error) {
            throw new Error(`wrong instruction program address or instruction number in transaction ${n}`);
        };

        if (
            instructionProgrammAddress === process.env.VELAS_ACCOUNT_PROGRAM_ADDRESS &&
            instructionNumber === 0
        ) {
            const address = instruction.keys[0] ? instruction.keys[0].pubkey : undefined;
            if (address) {
                return transfer(address);
            } else {
                throw new Error(`account address not found for airdrop in transaction ${n}`);
            };
        };
    };
};

export default airdropHendler;