import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  PageNumber,
  NumberFormat,
  PageBreak
} from 'docx';
import type { Draft, ThesisSection, Project, ThesisMetadata } from '@thesis-copilot/shared';
import { logger } from '../utils/logger.js';
import { ErrorCode, DraftingError } from '../utils/errors.js';
import * as FrontMatter from './front-matter-service.js';

// Create ExportError as an alias to DraftingError with EXPORT_FAILED code
class ExportError extends DraftingError {
  constructor(code: typeof ErrorCode.EXPORT_FAILED, message: string, context: any) {
    super(ErrorCode.DRAFTING_FAILED, message, context);
  }
}

/**
 * Convert HTML to plain text (basic conversion)
 * This removes HTML tags and converts basic formatting
 */
function htmlToText(html: string): string {
  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text.trim();
}

/**
 * Parse HTML into paragraphs and handle citations
 */
function parseHtmlContent(html: string): { text: string; hasCitation: boolean }[] {
  const paragraphs: { text: string; hasCitation: boolean }[] = [];

  // Match paragraph tags
  const pRegex = /<p[^>]*>(.*?)<\/p>/gs;
  let match;

  while ((match = pRegex.exec(html)) !== null) {
    const content = match[1];
    const text = htmlToText(content);

    if (text) {
      paragraphs.push({
        text,
        hasCitation: content.includes('[CITE:')
      });
    }
  }

  // If no paragraphs found, treat entire content as one paragraph
  if (paragraphs.length === 0 && html.trim()) {
    const text = htmlToText(html);
    if (text) {
      paragraphs.push({
        text,
        hasCitation: html.includes('[CITE:')
      });
    }
  }

  return paragraphs;
}

/**
 * Export a single section draft to DOCX
 */
export async function exportSectionToDocx(
  userId: string,
  project: Project,
  section: ThesisSection,
  draft: Draft
): Promise<Buffer> {
  try {
    logger.info('Exporting section to DOCX', {
      userId,
      projectId: project.id,
      sectionId: section.id
    });

    const children: Paragraph[] = [];

    // Add section title
    children.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: {
          after: 200
        }
      })
    );

    // Add section objective as subtitle
    if (section.objective) {
      children.push(
        new Paragraph({
          text: section.objective,
          italics: true,
          spacing: {
            after: 400
          }
        })
      );
    }

    // Parse and add content paragraphs
    const paragraphs = parseHtmlContent(draft.html);

    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.text
            })
          ],
          spacing: {
            after: 200
          }
        })
      );
    }

    // Add citations section if there are any
    if (draft.citations && draft.citations.length > 0) {
      children.push(
        new Paragraph({
          text: '',
          spacing: {
            before: 400,
            after: 200
          }
        })
      );

      children.push(
        new Paragraph({
          text: 'References',
          heading: HeadingLevel.HEADING_2,
          spacing: {
            after: 200
          }
        })
      );

      for (const citation of draft.citations) {
        children.push(
          new Paragraph({
            text: `${citation.sourceId}: ${citation.text || 'No preview available'}`,
            spacing: {
              after: 100
            }
          })
        );
      }
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children
        }
      ]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    logger.info('Successfully exported section to DOCX', {
      userId,
      projectId: project.id,
      sectionId: section.id,
      size: buffer.length
    });

    return buffer;
  } catch (error) {
    logger.error('Failed to export section to DOCX', {
      userId,
      projectId: project.id,
      sectionId: section.id,
      error
    });

    throw new ExportError(
      ErrorCode.EXPORT_FAILED,
      'Failed to generate DOCX export',
      { userId, projectId: project.id, sectionId: section.id }
    );
  }
}

/**
 * Export complete thesis with professional front matter
 * Includes title page, abstract, table of contents, and all sections
 */
export async function exportCompleteThesis(
  userId: string,
  project: Project,
  sections: Array<{ section: ThesisSection; draft: Draft }>
): Promise<Buffer> {
  try {
    logger.info('Exporting complete thesis with front matter', {
      userId,
      projectId: project.id,
      sectionCount: sections.length,
      hasMetadata: !!project.thesisMetadata
    });

    // Validate that thesis metadata exists
    if (!project.thesisMetadata) {
      throw new ExportError(
        ErrorCode.EXPORT_FAILED,
        'Thesis metadata is required for complete thesis export',
        { userId, projectId: project.id }
      );
    }

    const metadata = project.thesisMetadata;
    const docSections: any[] = [];

    // ===== FRONT MATTER (Roman numerals) =====

    // 1. Title Page (page i, number hidden)
    const titlePageContent = FrontMatter.generateTitlePage({
      metadata,
      hidePageNumber: true
    });

    docSections.push({
      properties: {
        page: {
          pageNumbers: {
            start: 1,
            formatType: NumberFormat.LOWER_ROMAN
          }
        }
      },
      children: titlePageContent
    });

    // 2. Copyright Page (optional, page ii)
    if (metadata.includeCopyright) {
      const copyrightContent = FrontMatter.generateCopyrightPage(metadata);

      docSections.push({
        properties: {
          page: {
            pageNumbers: {
              formatType: NumberFormat.LOWER_ROMAN
            }
          }
        },
        children: copyrightContent
      });
    }

    // 3. Abstract Page (page ii or iii depending on copyright)
    if (metadata.abstract) {
      const abstractContent = FrontMatter.generateAbstractPage({
        metadata,
        abstractText: metadata.abstract,
        keywords: [] // Could be added to metadata schema later
      });

      docSections.push({
        properties: {
          page: {
            pageNumbers: {
              formatType: NumberFormat.LOWER_ROMAN
            }
          }
        },
        children: abstractContent
      });
    }

    // 4. Dedication Page (optional)
    if (metadata.includeDedication && metadata.dedication) {
      const dedicationContent = FrontMatter.generateDedicationPage({
        metadata,
        dedicationText: metadata.dedication
      });

      docSections.push({
        properties: {
          page: {
            pageNumbers: {
              formatType: NumberFormat.LOWER_ROMAN
            }
          }
        },
        children: dedicationContent
      });
    }

    // 5. Acknowledgements Page (optional)
    if (metadata.includeAcknowledgements && metadata.acknowledgements) {
      const acknowledgementsContent = FrontMatter.generateAcknowledgementsPage({
        metadata,
        acknowledgementsText: metadata.acknowledgements
      });

      docSections.push({
        properties: {
          page: {
            pageNumbers: {
              formatType: NumberFormat.LOWER_ROMAN
            }
          }
        },
        children: acknowledgementsContent
      });
    }

    // 6. Table of Contents
    const tocContent = FrontMatter.generateTableOfContents({
      sections: project.constitution?.outline?.sections || [],
      includeFrontMatter: true,
      includeBackMatter: true
    });

    docSections.push({
      properties: {
        page: {
          pageNumbers: {
            formatType: NumberFormat.LOWER_ROMAN
          }
        }
      },
      children: tocContent
    });

    // 7. List of Tables (optional)
    if (metadata.includeListOfTables) {
      const tablesContent = FrontMatter.generateListOfTables({
        tables: [] // Would need to be extracted from drafts
      });

      docSections.push({
        properties: {
          page: {
            pageNumbers: {
              formatType: NumberFormat.LOWER_ROMAN
            }
          }
        },
        children: tablesContent
      });
    }

    // 8. List of Figures (optional)
    if (metadata.includeListOfFigures) {
      const figuresContent = FrontMatter.generateListOfFigures({
        figures: [] // Would need to be extracted from drafts
      });

      docSections.push({
        properties: {
          page: {
            pageNumbers: {
              formatType: NumberFormat.LOWER_ROMAN
            }
          }
        },
        children: figuresContent
      });
    }

    // ===== MAIN BODY (Arabic numerals starting at 1) =====

    // Add each thesis section
    for (let i = 0; i < sections.length; i++) {
      const { section, draft } = sections[i];
      const children: Paragraph[] = [];

      // Chapter heading
      children.push(
        new Paragraph({
          text: `Chapter ${i + 1}: ${section.title}`,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 400,
            after: 200
          }
        })
      );

      // Section objective as subtitle
      if (section.objective) {
        children.push(
          new Paragraph({
            text: section.objective,
            italics: true,
            spacing: {
              after: 300
            }
          })
        );
      }

      // Section content
      const paragraphs = parseHtmlContent(draft.html);

      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.text
              })
            ],
            spacing: {
              after: 200
            }
          })
        );
      }

      // First section starts Arabic numbering
      if (i === 0) {
        docSections.push({
          properties: {
            page: {
              pageNumbers: {
                start: 1,
                formatType: NumberFormat.DECIMAL
              }
            }
          },
          children
        });
      } else {
        docSections.push({
          properties: {
            page: {
              pageNumbers: {
                formatType: NumberFormat.DECIMAL
              }
            }
          },
          children
        });
      }
    }

    // ===== BACK MATTER (continues Arabic numerals) =====

    // References section
    const allCitations = sections.flatMap(s => s.draft.citations || []);
    const uniqueCitations = Array.from(
      new Map(allCitations.map(c => [c.sourceId, c])).values()
    );

    if (uniqueCitations.length > 0) {
      const referencesChildren: Paragraph[] = [];

      referencesChildren.push(
        new Paragraph({
          text: 'REFERENCES',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400
          }
        })
      );

      for (const citation of uniqueCitations) {
        referencesChildren.push(
          new Paragraph({
            text: `${citation.sourceId}: ${citation.text || 'No preview available'}`,
            spacing: {
              after: 150
            }
          })
        );
      }

      docSections.push({
        properties: {
          page: {
            pageNumbers: {
              formatType: NumberFormat.DECIMAL
            }
          }
        },
        children: referencesChildren
      });
    }

    // Create document with all sections
    const doc = new Document({
      sections: docSections
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    logger.info('Successfully exported complete thesis', {
      userId,
      projectId: project.id,
      sectionCount: sections.length,
      totalDocSections: docSections.length,
      size: buffer.length
    });

    return buffer;
  } catch (error) {
    logger.error('Failed to export complete thesis', {
      userId,
      projectId: project.id,
      error
    });

    throw new ExportError(
      ErrorCode.EXPORT_FAILED,
      'Failed to generate complete thesis export',
      { userId, projectId: project.id }
    );
  }
}

/**
 * Export entire project (all sections) to DOCX
 * Legacy function - use exportCompleteThesis for professional formatting
 */
export async function exportProjectToDocx(
  userId: string,
  project: Project,
  sections: Array<{ section: ThesisSection; draft: Draft }>
): Promise<Buffer> {
  try {
    logger.info('Exporting project to DOCX', {
      userId,
      projectId: project.id,
      sectionCount: sections.length
    });

    const children: Paragraph[] = [];

    // Add project title
    children.push(
      new Paragraph({
        text: project.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: {
          after: 400
        }
      })
    );

    // Add project description
    if (project.description) {
      children.push(
        new Paragraph({
          text: project.description,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 800
          }
        })
      );
    }

    // Add thesis constitution summary
    if (project.constitution) {
      children.push(
        new Paragraph({
          text: 'Abstract',
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 400,
            after: 200
          }
        })
      );

      if (project.constitution.scope) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Scope: ',
                bold: true
              }),
              new TextRun({
                text: project.constitution.scope
              })
            ],
            spacing: {
              after: 200
            }
          })
        );
      }

      if (project.constitution.coreArgument) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Core Argument: ',
                bold: true
              }),
              new TextRun({
                text: project.constitution.coreArgument
              })
            ],
            spacing: {
              after: 400
            }
          })
        );
      }
    }

    // Add each section
    for (const { section, draft } of sections) {
      // Section title
      children.push(
        new Paragraph({
          text: section.title,
          heading: HeadingLevel.HEADING_1,
          spacing: {
            before: 400,
            after: 200
          }
        })
      );

      // Section objective
      if (section.objective) {
        children.push(
          new Paragraph({
            text: section.objective,
            italics: true,
            spacing: {
              after: 300
            }
          })
        );
      }

      // Section content
      const paragraphs = parseHtmlContent(draft.html);

      for (const para of paragraphs) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.text
              })
            ],
            spacing: {
              after: 200
            }
          })
        );
      }
    }

    // Add references section at the end
    const allCitations = sections.flatMap(s => s.draft.citations || []);
    const uniqueCitations = Array.from(
      new Map(allCitations.map(c => [c.sourceId, c])).values()
    );

    if (uniqueCitations.length > 0) {
      children.push(
        new Paragraph({
          text: '',
          spacing: {
            before: 600,
            after: 200
          }
        })
      );

      children.push(
        new Paragraph({
          text: 'References',
          heading: HeadingLevel.HEADING_1,
          spacing: {
            after: 300
          }
        })
      );

      for (const citation of uniqueCitations) {
        children.push(
          new Paragraph({
            text: `${citation.sourceId}: ${citation.text || 'No preview available'}`,
            spacing: {
              after: 150
            }
          })
        );
      }
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children
        }
      ]
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    logger.info('Successfully exported project to DOCX', {
      userId,
      projectId: project.id,
      sectionCount: sections.length,
      size: buffer.length
    });

    return buffer;
  } catch (error) {
    logger.error('Failed to export project to DOCX', {
      userId,
      projectId: project.id,
      error
    });

    throw new ExportError(
      ErrorCode.EXPORT_FAILED,
      'Failed to generate project DOCX export',
      { userId, projectId: project.id }
    );
  }
}
