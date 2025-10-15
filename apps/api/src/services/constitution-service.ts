import { randomUUID } from 'crypto';
import { jsonrepair } from 'jsonrepair';
import { getFirestore } from '../lib/firestore.js';
import { generateChatCompletion } from '../ai/openrouter.js';
import type { 
  ThesisConstitution, 
  Project 
} from '@thesis-copilot/shared';

// Constitution generation prompts and types
export interface ConstitutionGenerationContext {
  projectTitle: string;
  topic: string;
  researchQuestions: string[];
  academicLevel: 'UNDERGRADUATE' | 'MASTERS' | 'PHD';
  discipline: string;
  thesisStatement?: string;
  existingSourceSummaries?: string[];
}

const CONSTITUTION_SYSTEM_PROMPT = `You are an expert academic advisor specializing in thesis structure and constitution development. Your role is to help students create comprehensive thesis constitutions that provide clear guidance for their academic writing process.

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

const buildConstitutionPrompt = (context: ConstitutionGenerationContext): string => {
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

const CONSTITUTION_REFINEMENT_PROMPT = `You are refining an existing thesis constitution based on user feedback. Maintain the overall structure and academic rigor while incorporating the requested changes.

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

const GENERATION_MODEL = 'anthropic/claude-3.5-sonnet';

function extractJsonPayload(rawOutput: string): string {
  const trimmed = rawOutput.trim();
  if (!trimmed) {
    return '{}';
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const withoutFence = fencedMatch ? fencedMatch[1] : trimmed;

  const start = withoutFence.indexOf('{');
  const end = withoutFence.lastIndexOf('}');

  if (start !== -1 && end !== -1 && end > start) {
    return withoutFence.slice(start, end + 1);
  }

  return withoutFence;
}

function parseConstitutionJson(rawOutput: string): any {
  const candidate = extractJsonPayload(rawOutput);

  try {
    return JSON.parse(candidate);
  } catch (error) {
    try {
      const repaired = jsonrepair(candidate);
      return JSON.parse(repaired);
    } catch (repairError) {
      const snippet = candidate.slice(0, 500);
      const parseMessage = error instanceof Error ? error.message : 'Unknown parse error';
      const repairMessage =
        repairError instanceof Error ? repairError.message : 'Unknown repair error';
      throw new Error(
        `Failed to parse constitution JSON. parseError=${parseMessage}; repairError=${repairMessage}; snippet=${snippet}`
      );
    }
  }
}

export interface ConstitutionGenerationRequest {
  projectId: string;
  academicLevel: 'UNDERGRADUATE' | 'MASTERS' | 'PHD';
  discipline: string;
  includeExistingSources?: boolean;
}

export interface ConstitutionRefinementRequest {
  projectId: string;
  feedback: string;
  preserveOutline?: boolean;
}

export interface ConstitutionGenerationResult {
  constitution: ThesisConstitution;
  generationMetadata: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    latencyMs: number;
    academicLevel: string;
    discipline: string;
    sourcesIncluded: number;
  };
}

/**
 * Generate a complete thesis constitution based on project details
 */
export async function generateConstitution(
  request: ConstitutionGenerationRequest
): Promise<ConstitutionGenerationResult> {
  const { projectId, academicLevel, discipline, includeExistingSources = false } = request;

  const db = getFirestore();

  // Fetch project details
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists) {
    throw new Error(`Project ${projectId} not found`);
  }

  const project = projectDoc.data() as Project;

  // Optionally fetch existing source summaries for context
  let existingSourceSummaries: string[] = [];
  if (includeExistingSources) {
    try {
      const sourcesSnapshot = await db
        .collection('sources')
        .where('projectId', '==', projectId)
        .where('status', '==', 'READY')
        .limit(5) // Limit to avoid token overflow
        .get();

      existingSourceSummaries = sourcesSnapshot.docs
        .map((doc: any) => doc.data().summary?.abstract)
        .filter(Boolean) as string[];
    } catch (error) {
      console.warn('Failed to fetch source summaries for constitution generation:', error);
      // Continue without source context
    }
  }

  // Build generation context
  const context: ConstitutionGenerationContext = {
    projectTitle: project.title,
    topic: project.topic,
    researchQuestions: project.researchQuestions,
    academicLevel,
    discipline,
    thesisStatement: project.thesisStatement,
    existingSourceSummaries
  };

  // Generate constitution using AI
  const prompt = buildConstitutionPrompt(context);

  const response = await generateChatCompletion({
    model: GENERATION_MODEL,
    systemPrompt: CONSTITUTION_SYSTEM_PROMPT,
    userPrompt: prompt,
    temperature: 0.7,
    maxTokens: 3000
  });

  const constitutionData = parseConstitutionJson(response.output || '');

  // Validate and structure the constitution
  const constitution: ThesisConstitution = {
    scope: constitutionData.scope || '',
    toneGuidelines: constitutionData.toneGuidelines || '',
    coreArgument: constitutionData.coreArgument || '',
    outline: {
      sections: (constitutionData.outline?.sections || []).map((section: any) => ({
        id: section.id || randomUUID(),
        title: section.title || 'Untitled Section',
        objective: section.objective || '',
        expectedLength: section.expectedLength || 2000
      }))
    }
  };

  // Validation checks
  if (!constitution.scope || !constitution.toneGuidelines || !constitution.coreArgument) {
    throw new Error('Generated constitution is missing required fields');
  }

  if (constitution.outline.sections.length === 0) {
    throw new Error('Generated constitution must include at least one section');
  }

  return {
    constitution,
    generationMetadata: {
      model: GENERATION_MODEL,
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      latencyMs: response.latencyMs,
      academicLevel,
      discipline,
      sourcesIncluded: existingSourceSummaries.length
    }
  };
}

/**
 * Refine an existing constitution based on user feedback
 */
export async function refineConstitution(
  request: ConstitutionRefinementRequest
): Promise<ConstitutionGenerationResult> {
  const { projectId, feedback, preserveOutline = false } = request;

  const db = getFirestore();

  // Fetch current project with constitution
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists) {
    throw new Error(`Project ${projectId} not found`);
  }

  const project = projectDoc.data() as Project;
  if (!project.constitution) {
    throw new Error('Project does not have an existing constitution to refine');
  }

  // Build refinement prompt
  const prompt = CONSTITUTION_REFINEMENT_PROMPT
    .replace('{currentConstitution}', JSON.stringify(project.constitution, null, 2))
    .replace('{userFeedback}', feedback);

  const response = await generateChatCompletion({
    model: GENERATION_MODEL,
    systemPrompt: CONSTITUTION_SYSTEM_PROMPT,
    userPrompt: prompt,
    temperature: 0.5, // Lower temperature for refinement
    maxTokens: 3000
  });

  const refinedData = parseConstitutionJson(response.output || '');

  // Structure refined constitution
  let constitution: ThesisConstitution = {
    scope: refinedData.scope || project.constitution.scope,
    toneGuidelines: refinedData.toneGuidelines || project.constitution.toneGuidelines,
    coreArgument: refinedData.coreArgument || project.constitution.coreArgument,
    outline: preserveOutline 
      ? project.constitution.outline
      : {
          sections: (refinedData.outline?.sections || []).map((section: any) => ({
            id: section.id || randomUUID(),
            title: section.title || 'Untitled Section',
            objective: section.objective || '',
            expectedLength: section.expectedLength || 2000
          }))
        }
  };

  return {
    constitution,
    generationMetadata: {
      model: GENERATION_MODEL,
      promptTokens: response.usage?.promptTokens || 0,
      completionTokens: response.usage?.completionTokens || 0,
      latencyMs: response.latencyMs,
      academicLevel: 'REFINEMENT',
      discipline: 'REFINEMENT',
      sourcesIncluded: 0
    }
  };
}

/**
 * Update project with generated constitution
 */
export async function saveConstitutionToProject(
  projectId: string,
  constitution: ThesisConstitution
): Promise<void> {
  const db = getFirestore();
  await db.collection('projects').doc(projectId).update({
    constitution,
    updatedAt: new Date()
  });
}

/**
 * Get constitution generation suggestions based on project analysis
 */
export async function getConstitutionSuggestions(
  projectId: string
): Promise<{
  suggestedAcademicLevel: string;
  suggestedDiscipline: string;
  reasoning: string;
  sourcesAvailable: number;
}> {
  const db = getFirestore();

  // Fetch project details
  const projectDoc = await db.collection('projects').doc(projectId).get();
  if (!projectDoc.exists) {
    throw new Error(`Project ${projectId} not found`);
  }

  const project = projectDoc.data() as Project;

  // Count available sources
  const sourcesSnapshot = await db
    .collection('sources')
    .where('projectId', '==', projectId)
    .where('status', '==', 'READY')
    .get();

  const sourcesAvailable = sourcesSnapshot.size;

  // Simple heuristic-based suggestions (could be enhanced with AI)
  const topicLower = project.topic.toLowerCase();
  
  let suggestedDiscipline = 'General';
  if (topicLower.includes('computer') || topicLower.includes('software') || topicLower.includes('technology')) {
    suggestedDiscipline = 'Computer Science';
  } else if (topicLower.includes('business') || topicLower.includes('management') || topicLower.includes('marketing')) {
    suggestedDiscipline = 'Business Administration';
  } else if (topicLower.includes('psychology') || topicLower.includes('behavior') || topicLower.includes('mental')) {
    suggestedDiscipline = 'Psychology';
  } else if (topicLower.includes('education') || topicLower.includes('learning') || topicLower.includes('teaching')) {
    suggestedDiscipline = 'Education';
  } else if (topicLower.includes('health') || topicLower.includes('medical') || topicLower.includes('clinical')) {
    suggestedDiscipline = 'Health Sciences';
  }

  // Suggest academic level based on complexity indicators
  let suggestedAcademicLevel = 'UNDERGRADUATE';
  const complexityIndicators = [
    'methodology', 'framework', 'theoretical', 'empirical', 
    'systematic', 'comprehensive', 'longitudinal', 'meta-analysis'
  ];
  
  const hasComplexityIndicators = complexityIndicators.some(indicator => 
    topicLower.includes(indicator) || 
    project.researchQuestions.some(q => q.toLowerCase().includes(indicator))
  );

  if (hasComplexityIndicators || project.researchQuestions.length > 3) {
    suggestedAcademicLevel = 'MASTERS';
  }

  if (project.researchQuestions.length > 5 || topicLower.includes('doctoral') || topicLower.includes('dissertation')) {
    suggestedAcademicLevel = 'PHD';
  }

  return {
    suggestedAcademicLevel,
    suggestedDiscipline,
    reasoning: `Based on topic analysis, research questions complexity, and available sources. ${sourcesAvailable} sources are available for context.`,
    sourcesAvailable
  };
}
