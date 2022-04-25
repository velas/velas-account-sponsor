import { nanoid } from 'nanoid';

class CSRF {
    constructor() {
      this.storage = {};
      this.ips = {};
      this.limit = 500;
    };

    getLimits(ip) {
        this.ips[ip] = this.ips[ip] || [];

        const transactions = this.ips[ip].filter((date) => date.getDate() === new Date().getDate())

        return {
            transactions:  transactions.length,
            daily_limit: this.limit,
            ip,
        }
    };

    resetLimits(ip) {
        this.ips[ip] = [];
        return true;
    };

    setLimit(amount) {
        this.limit = amount;
        return true;
    };
    
    register(ip) {
        // Registration new CSRF of tokens logic

        const id = nanoid();
        this.storage[id] = { 
            created: new Date().getTime(),
            ip,
        };
    
        console.log('\x1b[33m%s\x1b[0m', `[ CSRF REGISTRED ]`, id);
    
        return id;
    };

    verify(token, ip) {
        // TO DO: verification of CSRF tokens logic

        if (!this.storage[token]) throw new Error('invalid CSRF token');
        //if (!this.storage[token] || this.storage[token].ip !== ip ) throw new Error('invalid CSRF token');
        
        this.ips[ip] = this.ips[ip] || [];
        this.ips[ip] = this.ips[ip].filter((date) => date.getDate() === new Date().getDate())

        if (this.ips[ip].length >= this.limit ) throw new Error('daily transaction limit reached');

        this.ips[ip].push(new Date());

        //delete this.storage[token]; TO DO: delete after N transactions; 

        console.log('\x1b[33m%s\x1b[0m', `[ CSRF VERIFIED ]`, token);
    };
};

export default new CSRF();