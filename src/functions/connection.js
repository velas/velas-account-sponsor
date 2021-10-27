import * as dotenv from 'dotenv';
import { Connection } from '@velas/web3';

dotenv.config();

let connection;

console.log('\x1b[32m%s\x1b[0m', `[ NETWORK HOST    ]`, `${process.env.NETWORK_HOST}`)

const getConnection = () => {
    try {
        if (!connection) connection = new Connection(process.env.NETWORK_HOST, 'singleGossip');
        return connection;
    } catch (error) {
        throw new Error('Wrong env variable: NETWORK_HOST');
    };
};

export default getConnection;