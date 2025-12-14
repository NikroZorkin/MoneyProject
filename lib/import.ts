import { createHash } from 'crypto';
import { prisma } from './prisma';
import { ImportStatus } from '@prisma/client';

/**
 * Calculate file hash for deduplication
 */
export function calculateFileHash(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate extracted text hash
 */
export function calculateTextHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Check if import already exists by file hash
 */
export async function findExistingImport(fileHash: string): Promise<string | null> {
  const existing = await prisma.import.findUnique({
    where: { fileHash },
    select: { id: true },
  });
  return existing?.id ?? null;
}

/**
 * Create import record
 */
export async function createImport(
  fileHash: string,
  extractedTextHash?: string,
  statementFrom?: Date,
  statementTo?: Date
) {
  return prisma.import.create({
    data: {
      fileHash,
      extractedTextHash: extractedTextHash ?? null,
      statementFrom: statementFrom ?? null,
      statementTo: statementTo ?? null,
      status: ImportStatus.PENDING,
    },
  });
}



