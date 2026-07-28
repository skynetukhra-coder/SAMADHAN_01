const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\Administrator\\Downloads\\127_0_0_1.sql', 'utf8');
console.log('Includes details table CREATE:', content.includes('CREATE TABLE `details`') || content.includes('CREATE TABLE details'));
console.log('Includes samadhan_db DB create:', content.includes('CREATE DATABASE IF NOT EXISTS `samadhan_db`'));
