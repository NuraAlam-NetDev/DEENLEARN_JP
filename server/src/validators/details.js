import { z } from 'zod';

export const detailsSchema = z
  .object({
    address: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().max(80).optional().default(''),
    country: z.string().trim().max(80).optional().default(''),
    contactMethod: z.enum(['whatsapp', 'telegram', 'phone', 'email', 'other']).default('email'),
    contactNumber: z.string().trim().max(30).optional().default(''),
    contactOther: z.string().trim().max(40).optional().default(''),
  })
  .superRefine((v, ctx) => {
    if (v.contactMethod !== 'email' && !/^\+?[0-9 ()-]{6,20}$/.test(v.contactNumber)) {
      ctx.addIssue({ code: 'custom', path: ['contactNumber'], message: 'Enter a valid phone number (digits, optional +)' });
    }
    if (v.contactMethod === 'other' && !v.contactOther) {
      ctx.addIssue({ code: 'custom', path: ['contactOther'], message: 'Say which app or method you use' });
    }
  });
