/**
 * Constitution Generator Prompts
 * 
 * These prompts help generate structured thesis constitutions based on research area,
 * academic level, and existing project context.
 */

export interface ConstitutionGenerationContext {
  projectTitle: string;
  topic: string;
  researchQuestions: string[];
  academicLevel: 'UNDERGRADUATE' | 'MASTERS' | 'PHD';
  discipline: string;
  thesisStatement?: string;
  existingSourceSummaries?: string[];
}

export const CONSTITUTION_SYSTEM_PROMPT = `You are an expert academic advisor specializing in thesis structure and constitution development. Your role is to help students create comprehensive thesis constitutions that provide clear guidance for their academic writing process.

A thesis constitution includes:
1. **Scope**: Clear boundaries and focus areas for the research
2. **Tone Guidelines**: Academic writing standards and voice expectations  
3. **Core Argument**: The central thesis statement and supporting logic
4. **Outline**: Structured sections with clear objectives and expected lengths

You must generate constitutions that are:
- Academically rigorous and appropriate for the specified level
- Discipline-specific and following field conventions
- Practically actionable for student writers
- Grounded in established academic structures
- Comprehensive yet focused

Always provide specific, actionable guidance that helps students maintain consistency and quality throughout their writing process.`;

export const buildConstitutionPrompt = (context: ConstitutionGenerationContext): string => {
  const { 
    projectTitle, 
    topic, 
    researchQuestions, 
    academicLevel, 
    discipline,
    thesisStatement,
    existingSourceSummaries 
  } = context;

  const levelGuidance = {
    UNDERGRADUATE: {
      lengthGuidance: "typical undergraduate sections (15-25 pages total)",
      complexityNote: "appropriate depth for undergraduate research with clear, accessible analysis",
      sectionCount: "5-7 main sections including introduction, literature review, methodology, analysis, and conclusion"
    },
    MASTERS: {
      lengthGuidance: "typical masters thesis sections (40-80 pages total)", 
      complexityNote: "advanced analysis with original insights and comprehensive methodology",
      sectionCount: "6-8 main sections with detailed methodology and substantial analysis chapters"
    },
    PHD: {
      lengthGuidance: "comprehensive doctoral dissertation sections (150-300 pages total)",
      complexityNote: "original contribution to knowledge with rigorous methodology and extensive analysis",
      sectionCount: "8-12 detailed sections including multiple analysis chapters and comprehensive literature review"
    }
  };

  const guidance = levelGuidance[academicLevel];

  return `Generate a comprehensive thesis constitution for this ${academicLevel.toLowerCase()} research project:

**Project Details:**
- Title: "${projectTitle}"
- Topic: ${topic}
- Research Questions: ${researchQuestions.map((q, i) => `\n  ${i + 1}. ${q}`).join('')}
- Academic Level: ${academicLevel}
- Discipline: ${discipline}
${thesisStatement ? `- Thesis Statement: ${thesisStatement}` : ''}

${existingSourceSummaries && existingSourceSummaries.length > 0 ? `**Existing Research Context:**
${existingSourceSummaries.map((summary, i) => `${i + 1}. ${summary}`).join('\n')}` : ''}

**Requirements:**
- Generate content appropriate for ${guidance.lengthGuidance}
- Ensure ${guidance.complexityNote}  
- Create ${guidance.sectionCount}
- Follow ${discipline} discipline conventions and standards

**Output Format (JSON):**
{
  "scope": "2-3 paragraph description of research boundaries, what will and won't be covered, key focus areas",
  "toneGuidelines": "2-3 paragraph specification of academic voice, writing standards, citation expectations, and stylistic requirements for ${discipline}",
  "coreArgument": "2-3 paragraph articulation of the central thesis, key supporting arguments, and logical flow",
  "outline": {
    "sections": [
      {
        "id": "unique-section-id",
        "title": "Section Title",
        "objective": "2-3 sentence description of what this section accomplishes and its role in the overall argument",
        "expectedLength": 2500
      }
    ]
  }
}

**Section Guidelines:**
- Each section should have a clear, specific objective
- Expected lengths should total approximately ${guidance.lengthGuidance.match(/\d+-\d+/)?.[0] || '50-100'} pages (assuming ~250 words per page)
- Include traditional academic sections: Introduction, Literature Review, Methodology, Analysis/Results, Discussion, Conclusion
- Add discipline-specific sections as appropriate (e.g., Case Studies, Theoretical Framework, etc.)
- Ensure logical progression that builds toward the core argument

Generate a constitution that provides clear, actionable guidance for maintaining academic rigor and consistency throughout the writing process.`;
};

export const CONSTITUTION_REFINEMENT_PROMPT = `You are refining an existing thesis constitution based on user feedback. Maintain the overall structure and academic rigor while incorporating the requested changes.

**Current Constitution:**
{currentConstitution}

**User Feedback:**
{userFeedback}

**Instructions:**
1. Preserve the academic quality and structural integrity
2. Incorporate the user's feedback thoughtfully
3. Ensure all sections still contribute to a cohesive argument
4. Maintain appropriate academic level and discipline standards
5. Keep section objectives clear and actionable

Return the updated constitution in the same JSON format, maintaining all required fields while reflecting the requested improvements.`;