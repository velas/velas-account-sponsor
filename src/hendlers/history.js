
import * as dotenv from 'dotenv';
import * as fetch from 'node-fetch';

dotenv.config();

let historyEvmAddresses;
let history = [];
let block;

try {
    historyEvmAddresses = JSON.parse(process.env.HISTORY_FOR_EVM_ADDRESS).map(name => name.toLowerCase());
} catch (_) {};

if (historyEvmAddresses) console.log('\x1b[32m%s\x1b[0m', `[ HISTORY ENABLED ]`, `${historyEvmAddresses}`);

( async() => {
    if(!process.env.NETWORK_HOST || !historyEvmAddresses) return;

    while (true) {
      try {    
        var rawResponse = await fetch(process.env.NETWORK_HOST, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"jsonrpc": "2.0", "id": "1", "method": "eth_blockNumber"}),
        });

        const content = await rawResponse.json();
        const blockHex = content.result.slice(2);
        const curBlock = parseInt(blockHex, 16);
     
        if (!block) block = curBlock;

        for (let i = block + 1; i <= curBlock; i++) {
            var rawResponseBlock = await fetch(process.env.NETWORK_HOST, {
                method: "POST",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({"jsonrpc": "2.0", "id": "1", "method": "eth_getBlockByNumber", "params": [`0x${i.toString(16)}`, true]}),
            });
    
            const contentBlock = await rawResponseBlock.json();
            const transactions = contentBlock.result ? contentBlock.result.transactions : [];

            if (transactions.length) {
                for (var transaction of transactions) {
                    if (historyEvmAddresses.includes(transaction.to)) history.push(transaction);
                };
            };
        };

        block = curBlock;
        history = history.slice(-10);

        await new Promise(resolve=>{setTimeout(resolve,2500)})
        
      } catch(_) {}
    }
})();

const historyHendler = () => {
    return history;
};

export default historyHendler;