import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  NumberFormat,
  Tab,
  TabStopPosition,
  TabStopType,
  BorderStyle,
  UnderlineType,
  Footer,
  Header,
  PageNumber
} from 'docx';
import type { Draft, ThesisSection, Project, ThesisMetadata, Citation } from '@thesis-copilot/shared';
import { logger } from '../utils/logger.js';
import { ErrorCode, DraftingError } from '../utils/errors.js';
import * as FrontMatter from './front-matter-service.js';

class ExportError extends DraftingError {
  constructor(code: typeof ErrorCode.EXPORT_FAILED, message: string, context: any) {
    super(ErrorCode.DRAFTING_FAILED, message, context);
  }
}

// ===== CITATION PROCESSING =====

interface ProcessedText {
  runs: TextRun[];
  citationNumbers: number[];
}

/**
 * Build a citation map from sourceId to citation number
 */
function buildCitationMap(citations: Citation[]): Map<string, { number: number; citation: Citation }> {
  const map = new Map<string, { number: number; citation: Citation }>();
  const uniqueCitations = Array.from(
    new Map(citations.map(c => [c.sourceId, c])).values()
  );

  uniqueCitations.forEach((citation, index) => {
    map.set(citation.sourceId, { number: index + 1, citation });
  });

  return map;
}

/**
 * Process text to replace [CITE:sourceId] with superscript numbers
 * Returns array of TextRuns with proper formatting
 */
function processCitations(text: string, citationMap: Map<string, { number: number; citation: Citation }>): ProcessedText {
  const runs: TextRun[] = [];
  const citationNumbers: number[] = [];

  // Regex to find [CITE:sourceId] patterns
  const citeRegex = /\[CITE:([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = citeRegex.exec(text)) !== null) {
    // Add text before citation
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore) {
        runs.push(new TextRun({ text: textBefore }));
      }
    }

    // Add citation as superscript number
    const sourceId = match[1];
    const citationInfo = citationMap.get(sourceId);

    if (citationInfo) {
      runs.push(
        new TextRun({
          text: citationInfo.number.toString(),
          superScript: true,
          size: 20 // 10pt font for superscript
        })
      );
      citationNumbers.push(citationInfo.number);
    } else {
      // Fallback if citation not found
      runs.push(new TextRun({ text: '[?]', superScript: true }));
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    runs.push(new TextRun({ text: text.substring(lastIndex) }));
  }

  // If no citations found, return the whole text as one run
  if (runs.length === 0) {
    runs.push(new TextRun({ text }));
  }

  return { runs, citationNumbers };
}

// ===== HTML PARSING WITH STRUCTURE PRESERVATION =====

interface ParsedContent {
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'list-item';
  text: string;
  level?: HeadingLevel;
}

/**
 * Parse HTML content preserving structure (headings, paragraphs, lists)
 */
function parseHtmlStructure(html: string): ParsedContent[] {
  const content: ParsedContent[] = [];

  // Clean up HTML
  html = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Parse h1 tags
  const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gis;
  let match;
  while ((match = h1Regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      content.push({
        type: 'heading1',
        text,
        level: HeadingLevel.HEADING_1
      });
    }
  }

  // Parse h2 tags
  const h2Regex = /<h2[^>]*>(.*?)<\/h2>/gis;
  while ((match = h2Regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      content.push({
        type: 'heading2',
        text,
        level: HeadingLevel.HEADING_2
      });
    }
  }

  // Parse h3 tags
  const h3Regex = /<h3[^>]*>(.*?)<\/h3>/gis;
  while ((match = h3Regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      content.push({
        type: 'heading3',
        text,
        level: HeadingLevel.HEADING_3
      });
    }
  }

  // Parse list items
  const liRegex = /<li[^>]*>(.*?)<\/li>/gis;
  while ((match = liRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      content.push({
        type: 'list-item',
        text
      });
    }
  }

  // Parse paragraphs
  const pRegex = /<p[^>]*>(.*?)<\/p>/gis;
  while ((match = pRegex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]*>/g, '').trim();
    if (text) {
      content.push({
        type: 'paragraph',
        text
      });
    }
  }

  // If no structured content found, treat as plain text paragraphs
  if (content.length === 0) {
    const plainText = html.replace(/<[^>]*>/g, '').trim();
    if (plainText) {
      // Split by double newlines for paragraphs
      const paragraphs = plainText.split(/\n\n+/);
      paragraphs.forEach(para => {
        const trimmed = para.trim();
        if (trimmed) {
          content.push({
            type: 'paragraph',
            text: trimmed
          });
        }
      });
    }
  }

  return content;
}

/**
 * Convert parsed content to DOCX paragraphs with proper citations
 */
function contentToParagraphs(
  content: ParsedContent[],
  citationMap: Map<string, { number: number; citation: Citation }>
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (const item of content) {
    const processed = processCitations(item.text, citationMap);

    switch (item.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
        paragraphs.push(
          new Paragraph({
            children: processed.runs,
            heading: item.level,
            spacing: {
              before: 400,
              after: 200
            }
          })
        );
        break;

      case 'list-item':
        paragraphs.push(
          new Paragraph({
            children: processed.runs,
            bullet: {
              level: 0
            },
            spacing: {
              after: 120
            },
            indent: {
              left: 720,
              hanging: 360
            }
          })
        );
        break;

      case 'paragraph':
      default:
        paragraphs.push(
          new Paragraph({
            children: processed.runs,
            spacing: {
              after: 240, // Double-spaced paragraphs
              line: 480 // 2.0 line spacing (240 * 2)
            },
            alignment: AlignmentType.JUSTIFIED,
            indent: {
              firstLine: 720 // 0.5 inch first-line indent
            }
          })
        );
        break;
    }
  }

  return paragraphs;
}

// ===== REFERENCE FORMATTING =====

/**
 * Format citation according to style (APA, MLA, Chicago)
 */
function formatReference(citation: Citation, citationStyle: string, index: number): string {
  // Extract metadata from citation text or use defaults
  const text = citation.text || 'Unknown source';

  // For now, return the citation as-is with a number
  // In production, this would parse the citation object and format properly
  return `${index + 1}. ${text}`;
}

// ===== PROFESSIONAL THESIS DOCUMENT SETTINGS =====

const THESIS_STYLES = {
  // Standard thesis formatting
  margins: {
    top: 1440,    // 1 inch (1440 twips)
    bottom: 1440,
    left: 1800,   // 1.25 inches for binding
    right: 1440
  },
  fonts: {
    body: 'Times New Roman',
    heading: 'Times New Roman',
    size: 24 // 12pt (half-points)
  },
  spacing: {
    line: 480, // Double spacing (240 * 2)
    paragraph: 240 // 12pt after paragraphs
  }
};

/**
 * Export complete thesis with professional academic formatting
 */
export async function exportCompleteThesis(
  userId: string,
  project: Project,
  sections: Array<{ section: ThesisSection; draft: Draft }>
): Promise<Buffer> {
  try {
    logger.info('Exporting complete thesis with professional formatting', {
      userId,
      projectId: project.id,
      sectionCount: sections.length,
      hasMetadata: !!project.thesisMetadata,
      citationStyle: project.citationStyle
    });

    const docSections: any[] = [];

    // Build global citation map
    const allCitations = sections.flatMap(s => s.draft.citations || []);
    const citationMap = buildCitationMap(allCitations);

    // ===== FRONT MATTER (optional - only if metadata exists) =====

    const metadata = project.thesisMetadata;
    const hasFrontMatter = !!metadata;

    if (hasFrontMatter) {
      // 1. Title Page
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
            },
            margin: THESIS_STYLES.margins
          }
        },
        children: titlePageContent
      });

      // 2. Copyright Page (optional)
      if (metadata.includeCopyright) {
        docSections.push({
          properties: {
            page: {
              pageNumbers: { formatType: NumberFormat.LOWER_ROMAN },
              margin: THESIS_STYLES.margins
            }
          },
          children: FrontMatter.generateCopyrightPage(metadata)
        });
      }

      // 3. Abstract Page
      if (metadata.abstract) {
        docSections.push({
          properties: {
            page: {
              pageNumbers: { formatType: NumberFormat.LOWER_ROMAN },
              margin: THESIS_STYLES.margins
            }
          },
          children: FrontMatter.generateAbstractPage({
            metadata,
            abstractText: metadata.abstract,
            keywords: []
          })
        });
      }

      // 4. Dedication (optional)
      if (metadata.includeDedication && metadata.dedication) {
        docSections.push({
          properties: {
            page: {
              pageNumbers: { formatType: NumberFormat.LOWER_ROMAN },
              margin: THESIS_STYLES.margins
            }
          },
          children: FrontMatter.generateDedicationPage({
            metadata,
            dedicationText: metadata.dedication
          })
        });
      }

      // 5. Acknowledgements (optional)
      if (metadata.includeAcknowledgements && metadata.acknowledgements) {
        docSections.push({
          properties: {
            page: {
              pageNumbers: { formatType: NumberFormat.LOWER_ROMAN },
              margin: THESIS_STYLES.margins
            }
          },
          children: FrontMatter.generateAcknowledgementsPage({
            metadata,
            acknowledgementsText: metadata.acknowledgements
          })
        });
      }

      // 6. Table of Contents
      docSections.push({
        properties: {
          page: {
            pageNumbers: { formatType: NumberFormat.LOWER_ROMAN },
            margin: THESIS_STYLES.margins
          }
        },
        children: FrontMatter.generateTableOfContents({
          sections: project.constitution?.outline?.sections || [],
          includeFrontMatter: true,
          includeBackMatter: true
        })
      });

      // 7. List of Tables (optional)
      if (metadata.includeListOfTables) {
        docSections.push({
          properties: {
            page: {
              pageNumbers: { formatType: NumberFormat.LOWER_ROMAN },
              margin: THESIS_STYLES.margins
            }
          },
          children: FrontMatter.generateListOfTables({ tables: [] })
        });
      }

      // 8. List of Figures (optional)
      if (metadata.includeListOfFigures) {
        docSections.push({
          properties: {
            page: {
              pageNumbers: { formatType: NumberFormat.LOWER_ROMAN },
              margin: THESIS_STYLES.margins
            }
          },
          children: FrontMatter.generateListOfFigures({ figures: [] })
        });
      }
    }

    // ===== MAIN BODY (Arabic numerals starting at 1) =====

    for (let i = 0; i < sections.length; i++) {
      const { section, draft } = sections[i];
      const children: Paragraph[] = [];

      // Chapter heading
      children.push(
        new Paragraph({
          text: `Chapter ${i + 1}: ${section.title}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 480, // Extra space before chapter
            after: 360
          },
          pageBreakBefore: i > 0 // Start each chapter on new page (except first)
        })
      );

      // Parse and add content with proper citations
      const parsedContent = parseHtmlStructure(draft.html);
      const contentParagraphs = contentToParagraphs(parsedContent, citationMap);
      children.push(...contentParagraphs);

      // First section starts Arabic numbering
      if (i === 0) {
        docSections.push({
          properties: {
            page: {
              pageNumbers: {
                start: 1,
                formatType: NumberFormat.DECIMAL
              },
              margin: THESIS_STYLES.margins
            }
          },
          children
        });
      } else {
        docSections.push({
          properties: {
            page: {
              pageNumbers: { formatType: NumberFormat.DECIMAL },
              margin: THESIS_STYLES.margins
            }
          },
          children
        });
      }
    }

    // ===== REFERENCES (Back Matter) =====

    if (citationMap.size > 0) {
      const referencesChildren: Paragraph[] = [];

      // References heading
      referencesChildren.push(
        new Paragraph({
          text: 'REFERENCES',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            before: 480,
            after: 480
          },
          pageBreakBefore: true // Start references on new page
        })
      );

      // Add each reference
      const sortedCitations = Array.from(citationMap.values())
        .sort((a, b) => a.number - b.number);

      for (const { number, citation } of sortedCitations) {
        const formattedRef = formatReference(citation, project.citationStyle, number - 1);

        referencesChildren.push(
          new Paragraph({
            text: formattedRef,
            spacing: {
              after: 240,
              line: 480
            },
            indent: {
              left: 720,
              hanging: 360 // Hanging indent for references
            }
          })
        );
      }

      docSections.push({
        properties: {
          page: {
            pageNumbers: { formatType: NumberFormat.DECIMAL },
            margin: THESIS_STYLES.margins
          }
        },
        children: referencesChildren
      });
    }

    // ===== CREATE DOCUMENT =====

    const doc = new Document({
      sections: docSections,
      styles: {
        default: {
          document: {
            run: {
              font: THESIS_STYLES.fonts.body,
              size: THESIS_STYLES.fonts.size
            },
            paragraph: {
              spacing: {
                line: THESIS_STYLES.spacing.line,
                after: THESIS_STYLES.spacing.paragraph
              }
            }
          }
        }
      }
    });

    const buffer = await Packer.toBuffer(doc);

    logger.info('Successfully exported professional thesis', {
      userId,
      projectId: project.id,
      sectionCount: sections.length,
      citationCount: citationMap.size,
      size: buffer.length
    });

    return buffer;
  } catch (error) {
    logger.error('Failed to export thesis', {
      userId,
      projectId: project.id,
      error
    });

    throw new ExportError(
      ErrorCode.EXPORT_FAILED,
      'Failed to generate thesis export',
      { userId, projectId: project.id }
    );
  }
}

// Export single section (for compatibility)
export async function exportSectionToDocx(
  userId: string,
  project: Project,
  section: ThesisSection,
  draft: Draft
): Promise<Buffer> {
  // Use the same logic but for a single section
  return exportCompleteThesis(userId, project, [{ section, draft }]);
}

// Legacy function
export async function exportProjectToDocx(
  userId: string,
  project: Project,
  sections: Array<{ section: ThesisSection; draft: Draft }>
): Promise<Buffer> {
  return exportCompleteThesis(userId, project, sections);
}
