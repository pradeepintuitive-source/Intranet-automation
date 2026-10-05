const xlsx = require('xlsx');
const fs = require('fs');
const workbook = xlsx.readFile('test-data/source/Merged_Comprehensive_Joiners_AR_Invoice_Test_Cases.xlsx');
const sheet_name_list = workbook.SheetNames;
const allData = {};

sheet_name_list.forEach(sheet => {
  if (sheet.toLowerCase().includes('ar') || sheet.toLowerCase().includes('invoice') || sheet.toLowerCase().includes('case')) {
     allData[sheet] = xlsx.utils.sheet_to_json(workbook.Sheets[sheet]);
  }
});
fs.writeFileSync('ar_test_cases.json', JSON.stringify(allData, null, 2));
console.log('Saved to ar_test_cases.json');
