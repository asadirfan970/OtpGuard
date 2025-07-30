import { storage } from '../storage';
import { FileService } from './fileService';

export class ScriptService {
  static async injectPhoneNumbers(scriptContent: string, phoneNumbers: string[]): Promise<string> {
    // Create numbers.txt content
    const numbersContent = phoneNumbers.join('\n');
    
    // Inject phone numbers into script
    // This is a simple injection - in practice, you'd have a more sophisticated template system
    const injectedScript = scriptContent.replace(
      '# PHONE_NUMBERS_PLACEHOLDER',
      `phone_numbers = ${JSON.stringify(phoneNumbers)}`
    );
    
    return injectedScript;
  }

  static validatePhoneNumbers(phoneNumbers: string[], countryCode: string, expectedLength: number): string[] {
    const validNumbers: string[] = [];
    
    for (const number of phoneNumbers) {
      let cleanNumber = number.trim();
      
      // Remove country code if present
      if (cleanNumber.startsWith(countryCode)) {
        cleanNumber = cleanNumber.substring(countryCode.length);
      }
      
      // Remove any non-digit characters
      cleanNumber = cleanNumber.replace(/\D/g, '');
      
      // Check if length matches expected
      if (cleanNumber.length === expectedLength) {
        validNumbers.push(cleanNumber);
      }
    }
    
    return validNumbers;
  }

  static async prepareScriptForDownload(
    scriptId: string, 
    countryId: string, 
    phoneNumbers: string[]
  ): Promise<{ content: string; tempPath: string }> {
    const script = await storage.getScript(scriptId);
    if (!script) {
      throw new Error('Script not found');
    }

    const country = await storage.getCountry(countryId);
    if (!country) {
      throw new Error('Country not found');
    }

    // Validate phone numbers
    const validNumbers = this.validatePhoneNumbers(
      phoneNumbers, 
      country.code, 
      country.numberLength
    );

    if (validNumbers.length === 0) {
      throw new Error('No valid phone numbers found');
    }

    // Read script content
    const scriptContent = await FileService.readScript(script.filePath);
    
    // Inject phone numbers
    const injectedScript = await this.injectPhoneNumbers(scriptContent, validNumbers);
    
    // Create temporary file
    const tempPath = await FileService.createTempFile(injectedScript);
    
    return {
      content: injectedScript,
      tempPath
    };
  }
}
