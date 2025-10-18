import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from 'docx';
import type { Draft, ThesisSection, Project } from '@thesis-copilot/shared';
import { logger } from '../utils/logger.js';
import { ErrorCode, DraftingError } from '../utils/errors.js';

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
 * Export entire project (all sections) to DOCX
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
