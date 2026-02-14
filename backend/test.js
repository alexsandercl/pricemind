const nodemailer = require('nodemailer');
console.log('Tipo:', typeof nodemailer);
console.log('Keys:', Object.keys(nodemailer));
console.log('createTransporter:', typeof nodemailer.createTransporter);