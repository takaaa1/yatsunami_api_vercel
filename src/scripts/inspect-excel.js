const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', '..', 'produtos.xlsx');
console.log('Reading file:', filePath);

try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('Headers:', data[0]);
    console.log('Sample Row 1:', data[1]);
    console.log('Sample Row 2:', data[2]);
} catch (error) {
    console.error('Error reading Excel:', error.message);
    process.exit(1);
}
