import { z } from 'zod';
import { toPdfText } from '../utils/pdfText.js';

// The name is printed on the PDF, whose built-in fonts only cover Latin letters.
// Accents are folded (Ḥasan -> Hasan); Arabic / Bengali letters are rejected with a clear message.
export const claimCertificateSchema = z.object({
  recipientName: z
    .string()
    .trim()
    .max(80, 'Name can be at most 80 characters')
    .transform((value, ctx) => {
      const { text, lost } = toPdfText(value);
      if (lost > 0) {
        ctx.addIssue({
          code: 'custom',
          message: 'Please write your name using English letters (Arabic and Bengali letters cannot be printed on the PDF yet)',
        });
        return z.NEVER;
      }
      if (text.length < 2) {
        ctx.addIssue({ code: 'custom', message: 'Enter the name to print on your certificate' });
        return z.NEVER;
      }
      return text;
    }),
});
