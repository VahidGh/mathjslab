import Decimal from 'decimal.js';

console.log('Starting test...');


const decimal = new Decimal(1.25);
console.log(decimal);
console.log(decimal.constructor.name);

const number = 1.25;
console.log(number);
console.log(number.constructor.name);

const xx = Decimal;
const t = new xx(1)
