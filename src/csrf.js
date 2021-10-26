import { nanoid } from 'nanoid';

class CSRF {
    constructor() {
      this.storage = {};
    };
    
    register() {
        // Registration new CSRF of tokens logic

        const id = nanoid();
        this.storage[id] = { created: new Date().getTime() };
    
        console.log('\x1b[33m%s\x1b[0m', `[ CSRF REGISTRED ]`, id);
    
        return id;
    };

    verify(token) {
        // TO DO: verification of CSRF tokens logic

        if (!this.storage[token]) throw new Error('invalid CSRF token');

        console.log('\x1b[33m%s\x1b[0m', `[ CSRF VERIFIED ]`, token);
    };
};

export default CSRF;