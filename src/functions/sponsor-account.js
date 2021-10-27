import * as dotenv from 'dotenv';
import { Account } from '@velas/web3';
import bs58        from 'bs58';

dotenv.config();

let sponsor;

const getSponsorAccount = () => {
    try {
        if (!sponsor) {
            sponsor = new Account(bs58.decode(process.env.SPONSOR_PRIVATE));
            console.log('\x1b[32m%s\x1b[0m', `[ CURRENT SPONSOR ]`, `${sponsor.publicKey.toBase58()}`)
        };

        return sponsor;
    } catch (error) {
        console.log(error);
        throw new Error('Wrong env variable: SPONSOR_PRIVATE');
    };
};

export default getSponsorAccount;