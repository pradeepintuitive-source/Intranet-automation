import * as xlsx from 'xlsx';

export class ExcelUtils {
  static readWorkbook(filePath: string): xlsx.WorkBook {
    try {
      return xlsx.readFile(filePath);
    } catch (error: any) {
      throw new Error(`Failed to read Excel file at ${filePath}: ${error.message}`);
    }
  }

  static getWorksheet(workbook: xlsx.WorkBook, sheetName: string): xlsx.WorkSheet {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      throw new Error(`Worksheet "${sheetName}" not found. Available sheets: ${workbook.SheetNames.join(', ')}`);
    }
    return sheet;
  }

  static getFirstWorksheet(workbook: xlsx.WorkBook): { name: string, sheet: xlsx.WorkSheet } {
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
        throw new Error('Workbook is empty. No sheets found.');
    }
    return { name: sheetName, sheet: workbook.Sheets[sheetName] };
  }

  static sheetToJson<T>(sheet: xlsx.WorkSheet): T[] {
    // defval: '' ensures empty cells are empty strings rather than undefined
    return xlsx.utils.sheet_to_json<T>(sheet, { defval: '' });
  }
}
