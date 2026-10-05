import * as path from 'path';
import * as fs from 'fs';
import { ExcelUtils } from '../src/utils/ExcelUtils';

interface ExcelRow {
    Module: string;
    Name: string;
    'File Name': string;
    'File Path': string;
    Line: number | string;
    'Message Key': string;
    'Toast Message': string;
}

export interface ToastMessageDefinition {
    module: string;
    name: string;
    fileName: string;
    filePath: string;
    line: number;
    messageKey: string;
    messageTemplate: string;
}

const EXCEL_PATH = path.resolve(__dirname, '../test-data/source/Toast_Messages_Inventory.xlsx');
const OUTPUT_DIR = path.resolve(__dirname, '../test-data/toast');
const JSON_OUTPUT = path.join(OUTPUT_DIR, 'toastMessages.json');
const TS_OUTPUT = path.join(OUTPUT_DIR, 'toastMessages.ts');

function run() {
    console.log(`Reading ${path.basename(EXCEL_PATH)}...`);
    
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error(`Error: Excel file not found at ${EXCEL_PATH}`);
        process.exit(1);
    }

    const workbook = ExcelUtils.readWorkbook(EXCEL_PATH);
    console.log(`\nWorksheets found:\n- ${workbook.SheetNames.join('\n- ')}\n`);

    const { name, sheet } = ExcelUtils.getFirstWorksheet(workbook);
    const rows = ExcelUtils.sheetToJson<any>(sheet);

    console.log(`Rows processed: ${rows.length}`);

    if (rows.length === 0) {
        console.error('Error: Worksheet is empty.');
        process.exit(1);
    }

    // Validate columns on first row
    const firstRow = rows[0];
    const requiredColumns = ['Module Name', 'File Name', 'File Path', 'Line', 'Message Key', 'Toast Message'];
    
    // Check for missing columns
    const actualColumns = Object.keys(firstRow);
    const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));
    
    if (missingColumns.length > 0) {
        console.error(`Error: Missing required columns in Excel sheet: ${missingColumns.join(', ')}`);
        console.error(`Actual columns found: ${actualColumns.join(', ')}`);
        process.exit(1);
    }

    const testData: ToastMessageDefinition[] = [];
    let validCount = 0;
    let dynamicCount = 0;
    let invalidCount = 0;
    
    const uniqueMessages = new Set<string>();
    let duplicateCount = 0;
    const modules = new Set<string>();

    rows.forEach((row, index) => {
        const moduleName = row['Module Name']?.toString().trim();
        const toastMessage = row['Toast Message']?.toString().trim();
        
        // Basic validation: must have module and toast message
        if (!moduleName || !toastMessage) {
            console.warn(`Row ${index + 2}: Invalid row (Missing Module Name or Toast Message)`);
            invalidCount++;
            return;
        }

        const messageKey = row['Message Key']?.toString().trim() || `generated_${index}_${moduleName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
        
        const def: ToastMessageDefinition = {
            module: moduleName,
            name: '', // We don't have a separate Name column anymore
            fileName: row['File Name']?.toString().trim() || '',
            filePath: row['File Path']?.toString().trim() || '',
            line: parseInt(row['Line'], 10) || 0,
            messageKey: messageKey,
            messageTemplate: toastMessage
        };

        if (uniqueMessages.has(toastMessage)) {
            duplicateCount++;
        }
        uniqueMessages.add(toastMessage);
        modules.add(module);
        
        // Check for dynamic placeholders (e.g. {idx}, {new_status})
        if (/\{[a-zA-Z0-9_]+\}/.test(toastMessage)) {
            dynamicCount++;
        }

        testData.push(def);
        validCount++;
    });

    // Ensure output dir exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Write JSON
    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(testData, null, 2));

    // Write TS as a class with static properties
    let classProperties = '';
    
    // Group by module or just flat? The user asked for a single class.
    // We will make flat static properties using the messageKey.
    // If keys have spaces/invalid chars, we need to sanitize them.
    
    testData.forEach(def => {
        // Ensure valid JS identifier
        const safeKey = def.messageKey.replace(/[^a-zA-Z0-9_]/g, '_');
        
        // Escape quotes and backslashes in the message
        const safeMessage = def.messageTemplate
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n');
            
        classProperties += `  /** Module: ${def.module} | File: ${def.fileName} */\n`;
        classProperties += `  static readonly ${safeKey} = "${safeMessage}";\n\n`;
    });

    const tsContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// Source: test-data/source/Toast_Messages_Inventory.xlsx

export class ToastMessages {
${classProperties}

  /**
   * Formats a dynamic message template with provided values.
   * Example: ToastMessages.format(ToastMessages.INVOICE_STATUS_UPDATED, { status: "Paid" })
   */
  static format(template: string, values: Record<string, string | number>): string {
      return template.replace(/\\{([a-zA-Z0-9_]+)\\}/g, (match, key) => {
          return values[key] !== undefined ? String(values[key]) : match;
      });
  }
}
`;
    fs.writeFileSync(TS_OUTPUT, tsContent);

    console.log(`\nValid toast messages: ${validCount}`);
    console.log(`Dynamic messages: ${dynamicCount}`);
    console.log(`Duplicate messages: ${duplicateCount}`);
    console.log(`Invalid rows: ${invalidCount}`);
    console.log(`Modules found: ${modules.size} (${Array.from(modules).join(', ')})`);
    
    console.log(`\nToast test data generated successfully in test-data/toast/`);
}

run();
