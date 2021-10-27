import { Transaction, Message } from '@velas/web3';
import bs58 from 'bs58';

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

export default messageToTransaction;