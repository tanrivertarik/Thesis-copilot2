import type { ThesisMetadata, ThesisSection } from '@thesis-copilot/shared';
import { Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

/**
 * Front Matter Generator Service
 *
 * Generates professional thesis front matter sections following academic standards.
 * All pages use 1-inch margins and Times New Roman 12pt font (handled by export service).
 * Front matter uses Roman numeral pagination (i, ii, iii...).
 */

export interface TitlePageOptions {
  metadata: ThesisMetadata;
  hidePageNumber?: boolean; // Title page typically doesn't show page number
}

export interface AbstractPageOptions {
  metadata: ThesisMetadata;
  abstractText: string;
  keywords?: string[]; // Optional keywords for some disciplines
}

export interface AcknowledgementsPageOptions {
  metadata: ThesisMetadata;
  acknowledgementsText: string;
}

export interface DedicationPageOptions {
  metadata: ThesisMetadata;
  dedicationText: string;
}

export interface TableOfContentsOptions {
  sections: ThesisSection[];
  includeFrontMatter?: boolean;
  includeBackMatter?: boolean;
}

export interface ListOfTablesOptions {
  tables: Array<{
    number: number;
    title: string;
    pageNumber: number;
  }>;
}

export interface ListOfFiguresOptions {
  figures: Array<{
    number: number;
    title: string;
    pageNumber: number;
  }>;
}

/**
 * Generate professional title page following university standards
 *
 * Standard format:
 * - Thesis title (centered, double-spaced if multiple lines)
 * - "by" (centered)
 * - Author name (centered)
 * - Degree statement (centered)
 * - Institution name (centered)
 * - Department name (centered)
 * - Submission date (centered)
 * - Committee information (optional, centered)
 *
 * All text uses normal font (no bold), 1-inch margins
 */
export function generateTitlePage(options: TitlePageOptions): Paragraph[] {
  const { metadata, hidePageNumber = true } = options;
  const paragraphs: Paragraph[] = [];

  // Add vertical spacing from top (simulate ~2-3 inches)
  paragraphs.push(
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' })
  );

  // Thesis Title (centered, may span multiple lines)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: metadata.title,
          size: 24, // 12pt
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 } // Extra space after title
    })
  );

  // "by" text
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: 'by', size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  // Author name
  const authorFullName = [
    metadata.author.firstName,
    metadata.author.middleName,
    metadata.author.lastName
  ]
    .filter(Boolean)
    .join(' ');

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: authorFullName, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Degree statement
  const degreeStatement = metadata.degree.fullTitle
    ? `A thesis submitted in partial fulfillment of the requirements for the degree of ${metadata.degree.fullTitle}`
    : `A thesis submitted in partial fulfillment of the requirements for the ${metadata.degree.type.toLowerCase()} degree`;

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: degreeStatement, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  // Field of study
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: `in ${metadata.degree.fieldOfStudy}`, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Institution information
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: metadata.institution.name, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  if (metadata.institution.faculty) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: metadata.institution.faculty, size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: metadata.institution.department, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Submission date
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: metadata.submissionDate, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Committee information (if provided)
  if (metadata.committee && metadata.committee.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: 'Thesis Committee:', size: 24 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      })
    );

    metadata.committee.forEach((member) => {
      const memberText = `${member.name}, ${member.title} (${member.role})`;
      paragraphs.push(
        new Paragraph({
          children: [new TextRun({ text: memberText, size: 24 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 }
        })
      );
    });
  }

  return paragraphs;
}

/**
 * Generate copyright page (optional)
 *
 * Standard format:
 * - Copyright symbol and year centered at bottom of page
 * - Author name
 * - Optional rights statement
 */
export function generateCopyrightPage(metadata: ThesisMetadata): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Add vertical spacing to push content to bottom
  for (let i = 0; i < 20; i++) {
    paragraphs.push(new Paragraph({ text: '' }));
  }

  const copyrightYear = new Date(metadata.submissionDate).getFullYear() || new Date().getFullYear();
  const authorFullName = [
    metadata.author.firstName,
    metadata.author.middleName,
    metadata.author.lastName
  ]
    .filter(Boolean)
    .join(' ');

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `© Copyright ${copyrightYear}`,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: authorFullName,
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'All Rights Reserved',
          size: 24
        })
      ],
      alignment: AlignmentType.CENTER
    })
  );

  return paragraphs;
}

/**
 * Generate abstract page
 *
 * Standard format:
 * - "ABSTRACT" heading (centered, all caps)
 * - Thesis title (centered)
 * - "by" and author name (centered)
 * - Abstract text (justified, 200-350 words typically)
 * - Optional keywords
 */
export function generateAbstractPage(options: AbstractPageOptions): Paragraph[] {
  const { metadata, abstractText, keywords } = options;
  const paragraphs: Paragraph[] = [];

  // "ABSTRACT" heading
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'ABSTRACT',
          size: 24,
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Thesis title
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: metadata.title, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 }
    })
  );

  // "by"
  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: 'by', size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 }
    })
  );

  // Author name
  const authorFullName = [
    metadata.author.firstName,
    metadata.author.middleName,
    metadata.author.lastName
  ]
    .filter(Boolean)
    .join(' ');

  paragraphs.push(
    new Paragraph({
      children: [new TextRun({ text: authorFullName, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Abstract text (justified alignment)
  const abstractParagraphs = abstractText.split('\n\n').filter(Boolean);
  abstractParagraphs.forEach((para, index) => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: para, size: 24 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: {
          after: index < abstractParagraphs.length - 1 ? 200 : 400
        }
      })
    );
  });

  // Keywords (if provided)
  if (keywords && keywords.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Keywords: ', size: 24, bold: true }),
          new TextRun({ text: keywords.join(', '), size: 24 })
        ],
        alignment: AlignmentType.LEFT,
        spacing: { before: 200 }
      })
    );
  }

  return paragraphs;
}

/**
 * Generate dedication page (optional)
 *
 * Standard format:
 * - Centered, italicized dedication text
 * - Usually brief (1-2 lines)
 * - Positioned in upper third of page
 */
export function generateDedicationPage(options: DedicationPageOptions): Paragraph[] {
  const { dedicationText } = options;
  const paragraphs: Paragraph[] = [];

  // Add vertical spacing
  paragraphs.push(
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' })
  );

  // Dedication text (centered, italicized)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: dedicationText,
          size: 24,
          italics: true
        })
      ],
      alignment: AlignmentType.CENTER
    })
  );

  return paragraphs;
}

/**
 * Generate acknowledgements page (optional)
 *
 * Standard format:
 * - "ACKNOWLEDGEMENTS" heading (centered, all caps)
 * - Acknowledgement text (justified)
 * - May include multiple paragraphs
 */
export function generateAcknowledgementsPage(
  options: AcknowledgementsPageOptions
): Paragraph[] {
  const { acknowledgementsText } = options;
  const paragraphs: Paragraph[] = [];

  // "ACKNOWLEDGEMENTS" heading
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'ACKNOWLEDGEMENTS',
          size: 24,
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Acknowledgements text (may have multiple paragraphs)
  const ackParagraphs = acknowledgementsText.split('\n\n').filter(Boolean);
  ackParagraphs.forEach((para) => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: para, size: 24 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 }
      })
    );
  });

  return paragraphs;
}

/**
 * Generate Table of Contents
 *
 * Standard format:
 * - "TABLE OF CONTENTS" heading (centered, all caps)
 * - List of chapters/sections with page numbers
 * - May include front matter sections
 * - Dot leaders between title and page number
 */
export function generateTableOfContents(options: TableOfContentsOptions): Paragraph[] {
  const { sections, includeFrontMatter = true, includeBackMatter = true } = options;
  const paragraphs: Paragraph[] = [];

  // "TABLE OF CONTENTS" heading
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'TABLE OF CONTENTS',
          size: 24,
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Front matter entries (if included)
  if (includeFrontMatter) {
    const frontMatterEntries = [
      { title: 'ABSTRACT', page: 'ii' },
      { title: 'DEDICATION', page: 'iii' },
      { title: 'ACKNOWLEDGEMENTS', page: 'iv' },
      { title: 'LIST OF TABLES', page: 'v' },
      { title: 'LIST OF FIGURES', page: 'vi' }
    ];

    frontMatterEntries.forEach((entry) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: entry.title, size: 24 }),
            new TextRun({ text: ' ', size: 24 }),
            new TextRun({ text: entry.page, size: 24 })
          ],
          spacing: { after: 100 }
        })
      );
    });

    paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  }

  // Main body sections (chapters)
  sections.forEach((section, index) => {
    const chapterNumber = index + 1;
    const pageNumber = chapterNumber; // Simplified - will be calculated properly in export

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Chapter ${chapterNumber}: ${section.title}`, size: 24 }),
          new TextRun({ text: ' ', size: 24 }),
          new TextRun({ text: pageNumber.toString(), size: 24 })
        ],
        spacing: { after: 100 }
      })
    );
  });

  // Back matter entries (if included)
  if (includeBackMatter) {
    paragraphs.push(new Paragraph({ text: '', spacing: { after: 200 } }));

    const backMatterEntries = [
      { title: 'REFERENCES', page: '...' },
      { title: 'APPENDICES', page: '...' }
    ];

    backMatterEntries.forEach((entry) => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: entry.title, size: 24 }),
            new TextRun({ text: ' ', size: 24 }),
            new TextRun({ text: entry.page, size: 24 })
          ],
          spacing: { after: 100 }
        })
      );
    });
  }

  return paragraphs;
}

/**
 * Generate List of Tables
 *
 * Standard format:
 * - "LIST OF TABLES" heading (centered, all caps)
 * - Table number, caption, and page number
 */
export function generateListOfTables(options: ListOfTablesOptions): Paragraph[] {
  const { tables } = options;
  const paragraphs: Paragraph[] = [];

  // "LIST OF TABLES" heading
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'LIST OF TABLES',
          size: 24,
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Table entries
  tables.forEach((table) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Table ${table.number}: ${table.title}`, size: 24 }),
          new TextRun({ text: ' ', size: 24 }),
          new TextRun({ text: table.pageNumber.toString(), size: 24 })
        ],
        spacing: { after: 100 }
      })
    );
  });

  return paragraphs;
}

/**
 * Generate List of Figures
 *
 * Standard format:
 * - "LIST OF FIGURES" heading (centered, all caps)
 * - Figure number, caption, and page number
 */
export function generateListOfFigures(options: ListOfFiguresOptions): Paragraph[] {
  const { figures } = options;
  const paragraphs: Paragraph[] = [];

  // "LIST OF FIGURES" heading
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'LIST OF FIGURES',
          size: 24,
          bold: true
        })
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    })
  );

  // Figure entries
  figures.forEach((figure) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Figure ${figure.number}: ${figure.title}`, size: 24 }),
          new TextRun({ text: ' ', size: 24 }),
          new TextRun({ text: figure.pageNumber.toString(), size: 24 })
        ],
        spacing: { after: 100 }
      })
    );
  });

  return paragraphs;
}

/**
 * Helper function to format degree type as full title
 */
export function formatDegreeTitle(
  degreeType: 'BACHELOR' | 'MASTER' | 'PHD',
  fieldOfStudy: string
): string {
  const degreeMap: Record<string, string> = {
    BACHELOR: 'Bachelor of Science',
    MASTER: 'Master of Science',
    PHD: 'Doctor of Philosophy'
  };

  // This is a simplified version - in reality, you'd want to determine
  // if it's "Science", "Arts", etc. based on the field
  return degreeMap[degreeType] || degreeType;
}

/**
 * Helper function to validate that required metadata is present
 */
export function validateMetadataForFrontMatter(metadata: ThesisMetadata): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!metadata.title) errors.push('Title is required');
  if (!metadata.author.firstName) errors.push('Author first name is required');
  if (!metadata.author.lastName) errors.push('Author last name is required');
  if (!metadata.degree.type) errors.push('Degree type is required');
  if (!metadata.degree.fieldOfStudy) errors.push('Field of study is required');
  if (!metadata.institution.name) errors.push('Institution name is required');
  if (!metadata.institution.department) errors.push('Department is required');
  if (!metadata.submissionDate) errors.push('Submission date is required');

  return {
    valid: errors.length === 0,
    errors
  };
}
