import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
// No need to import Pool from '@neondatabase/serverless' anymore
import 'dotenv/config';


// Create the adapter with the connection config (PoolConfig)
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

// Pass the adapter to PrismaClient
const prisma = new PrismaClient({ adapter });

interface Contact {
  id: number;
  phoneNumber: string | null;
  email: string | null;
  linkedId: number | null;
  linkPrecedence: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
export const identifyContact = async (req: Request, res: Response) => {
  const { email, phoneNumber }: { email?: string; phoneNumber?: string | number } = req.body;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: "Email or phoneNumber required" });
  }

  // 2. Resolve 'exactOptionalPropertyTypes' errors
  // We use null instead of undefined to satisfy strict Prisma types
  const queryEmail = email ?? null;
  const queryPhone = phoneNumber ? phoneNumber.toString() : null;

  // 1. Find all contacts that match either email or phone
  const existingContacts = (await prisma.contact.findMany({
    where: {
      OR: [
        queryEmail ? { email: queryEmail } : {},
        queryPhone ? { phoneNumber: queryPhone } : {}
      ].filter(obj => Object.keys(obj).length > 0) // Filter out empty objects
    }
  })) as Contact[];

  // SCENARIO A: No existing contact -> Create new Primary
  if (existingContacts.length === 0) {
    const newContact = (await prisma.contact.create({
      data: {
        email: queryEmail,
        phoneNumber: queryPhone,
        linkPrecedence: "primary"
      }
    })) as Contact;

    return res.status(200).json({
      contact: {
        primaryContatctId: newContact.id,
        emails: [newContact.email].filter((e): e is string => e !== null),
        phoneNumbers: [newContact.phoneNumber].filter((p): p is string => p !== null),
        secondaryContactIds: []
      }
    });
  }

  // 2. Identify the true primary contact
  let primaryContact = existingContacts.find(c => c.linkPrecedence === "primary") || 
                       existingContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]!;
  
  if (primaryContact.linkPrecedence === "secondary" && primaryContact.linkedId) {
    const actualPrimary = (await prisma.contact.findUnique({
      where: { id: primaryContact.linkedId }
    })) as Contact | null;
    if (actualPrimary) primaryContact = actualPrimary;
  }

  // SCENARIO B: Check if we need to create a new secondary
  const isNewEmail = queryEmail && !existingContacts.some(c => c.email === queryEmail);
  const isNewPhone = queryPhone && !existingContacts.some(c => c.phoneNumber === queryPhone);

  if (isNewEmail || isNewPhone) {
    await prisma.contact.create({
      data: {
        email: queryEmail,
        phoneNumber: queryPhone,
        linkedId: primaryContact.id,
        linkPrecedence: "secondary"
      }
    });
  }

  // 3. Handle Merging
  const otherPrimaries = existingContacts.filter(c => c.linkPrecedence === "primary" && c.id !== primaryContact.id);
  
  for (const other of otherPrimaries) {
    const isPrimaryOlder = primaryContact.createdAt < other.createdAt;
    const older = isPrimaryOlder ? primaryContact : other;
    const younger = isPrimaryOlder ? other : primaryContact;

    await prisma.contact.update({
      where: { id: younger.id },
      data: { 
        linkPrecedence: "secondary", 
        linkedId: older.id 
      }
    });
    primaryContact = older;
  }

  // 4. Final Consolidation
  const allRelated = (await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryContact.id },
        { linkedId: primaryContact.id },
        { linkedId: { in: existingContacts.map(c => c.id) } }
      ]
    }
  })) as Contact[];

  const emails = Array.from(new Set(allRelated.map(c => c.email).filter((e): e is string => e !== null)));
  const phoneNumbers = Array.from(new Set(allRelated.map(c => c.phoneNumber).filter((p): p is string => p !== null)));
  const secondaryIds = allRelated.filter(c => c.linkPrecedence === "secondary").map(c => c.id);

  const finalEmails = [primaryContact.email, ...emails.filter(e => e !== primaryContact.email)].filter((e): e is string => e !== null);
  const finalPhones = [primaryContact.phoneNumber, ...phoneNumbers.filter(p => p !== primaryContact.phoneNumber)].filter((p): p is string => p !== null);

  return res.status(200).json({
    contact: {
      primaryContatctId: primaryContact.id,
      emails: finalEmails,
      phoneNumbers: finalPhones,
      secondaryContactIds: secondaryIds
    }
  });
};