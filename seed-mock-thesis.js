/**
 * Mock Thesis Data Seeder
 *
 * This script creates a complete example thesis project with:
 * - Project metadata
 * - Constitution with outline
 * - Multiple sources
 * - Draft content for sections
 *
 * Run with: node seed-mock-thesis.js
 */

import admin from 'firebase-admin';
import { randomUUID } from 'crypto';

// Initialize Firebase Admin with emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
  projectId: 'thesis-copilot-dev'
});

const db = admin.firestore();

// Demo user ID (matches Firebase emulator demo user)
const DEMO_USER_ID = 'demo-user';

// Mock thesis: AI in Education
const mockProject = {
  id: randomUUID(),
  ownerId: DEMO_USER_ID,
  title: 'The Impact of AI-Powered Learning Assistants on Student Academic Performance',
  topic: 'Artificial Intelligence in Educational Technology',
  researchQuestions: [
    'How do AI-powered learning assistants affect student engagement and motivation?',
    'What is the measurable impact on academic performance across different subject areas?',
    'What are the key factors that determine the effectiveness of AI tutoring systems?',
    'How do students and educators perceive the integration of AI in learning environments?'
  ],
  thesisStatement: 'AI-powered learning assistants significantly improve student academic performance by providing personalized, adaptive instruction while maintaining student engagement, though effectiveness varies based on implementation quality and pedagogical integration.',
  citationStyle: 'APA',
  targetWordCount: 25000,
  visibility: 'PRIVATE',
  constitution: {
    scope: 'This research investigates the integration of AI-powered learning assistants in higher education, focusing on undergraduate STEM courses. The study examines quantitative performance metrics, qualitative feedback from students and instructors, and comparative analysis with traditional teaching methods.',
    toneGuidelines: 'Maintain an objective, evidence-based academic tone. Present balanced analysis of both benefits and limitations. Use precise technical terminology when discussing AI systems while ensuring accessibility for education researchers.',
    coreArgument: 'AI-powered learning assistants represent a transformative force in education when properly implemented, offering personalized learning experiences that complement rather than replace human instruction, with measurable improvements in learning outcomes and student engagement.',
    outline: {
      sections: [
        {
          id: randomUUID(),
          title: 'Introduction',
          objective: 'Establish the context of AI in education, present the research problem, and outline the thesis structure.',
          expectedLength: 2000
        },
        {
          id: randomUUID(),
          title: 'Literature Review',
          objective: 'Critically analyze existing research on AI in education, learning theories, and educational technology effectiveness.',
          expectedLength: 5000
        },
        {
          id: randomUUID(),
          title: 'Methodology',
          objective: 'Detail the mixed-methods research design, participant selection, data collection procedures, and analysis methods.',
          expectedLength: 3000
        },
        {
          id: randomUUID(),
          title: 'System Design and Implementation',
          objective: 'Describe the AI learning assistant architecture, pedagogical framework, and deployment in educational settings.',
          expectedLength: 3500
        },
        {
          id: randomUUID(),
          title: 'Quantitative Results',
          objective: 'Present statistical analysis of academic performance data, engagement metrics, and comparative outcomes.',
          expectedLength: 3500
        },
        {
          id: randomUUID(),
          title: 'Qualitative Findings',
          objective: 'Analyze student and instructor perceptions, behavioral observations, and contextual factors affecting effectiveness.',
          expectedLength: 3000
        },
        {
          id: randomUUID(),
          title: 'Discussion',
          objective: 'Interpret findings in context of existing literature, discuss implications, and address research questions.',
          expectedLength: 3500
        },
        {
          id: randomUUID(),
          title: 'Conclusion',
          objective: 'Summarize key findings, discuss limitations, and suggest directions for future research.',
          expectedLength: 1500
        }
      ]
    }
  },
  thesisMetadata: {
    title: 'The Impact of AI-Powered Learning Assistants on Student Academic Performance',
    author: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      middleName: 'Marie',
      studentId: 'EDU2024001'
    },
    degree: {
      type: 'MASTER',
      fieldOfStudy: 'Educational Technology',
      fullTitle: 'Master of Science in Educational Technology'
    },
    institution: {
      name: 'University of California, Berkeley',
      department: 'Graduate School of Education',
      faculty: 'College of Education',
      location: 'Berkeley, California'
    },
    submissionDate: '2025-05-01',
    defenseDate: '2025-04-15',
    abstract: 'This thesis investigates the impact of AI-powered learning assistants on undergraduate student academic performance in STEM courses. Through a mixed-methods approach combining quantitative performance analysis and qualitative stakeholder interviews, this research demonstrates that well-designed AI tutoring systems can significantly improve learning outcomes while enhancing student engagement. The study involved 450 students across three universities over one academic year, revealing a 23% average improvement in assessment scores and 67% increase in voluntary study time among AI-assisted learners.',
    acknowledgements: 'I would like to express my deepest gratitude to my advisor, Dr. Michael Chen, for his invaluable guidance throughout this research journey. Special thanks to the participating universities and students who made this study possible. I am also grateful to my family for their unwavering support during my graduate studies.',
    dedication: 'To all educators who embrace technology to enhance learning, and to students everywhere striving for excellence.',
    includeCopyright: true,
    includeDedication: true,
    includeAcknowledgements: true,
    includeListOfTables: true,
    includeListOfFigures: true
  },
  createdAt: new Date('2024-09-01').toISOString(),
  updatedAt: new Date().toISOString()
};

// Mock sources
const mockSources = [
  {
    id: randomUUID(),
    projectId: mockProject.id,
    ownerId: DEMO_USER_ID,
    kind: 'PDF',
    status: 'READY',
    metadata: {
      title: 'Artificial Intelligence in Education: Promises and Implications',
      author: 'Holmes, W., Bialik, M., & Fadel, C.',
      year: '2023',
      publicationType: 'Book'
    },
    createdAt: new Date('2024-09-05').toISOString(),
    updatedAt: new Date('2024-09-05').toISOString()
  },
  {
    id: randomUUID(),
    projectId: mockProject.id,
    ownerId: DEMO_USER_ID,
    kind: 'PDF',
    status: 'READY',
    metadata: {
      title: 'The effectiveness of intelligent tutoring systems: A meta-analysis',
      author: 'Kulik, J.A., & Fletcher, J.D.',
      year: '2022',
      publicationType: 'Journal Article',
      journal: 'Review of Educational Research'
    },
    createdAt: new Date('2024-09-06').toISOString(),
    updatedAt: new Date('2024-09-06').toISOString()
  },
  {
    id: randomUUID(),
    projectId: mockProject.id,
    ownerId: DEMO_USER_ID,
    kind: 'PDF',
    status: 'READY',
    metadata: {
      title: 'Personalized learning through AI: Current practices and future directions',
      author: 'Xie, H., Chu, H., Hwang, G., & Wang, C.',
      year: '2023',
      publicationType: 'Journal Article',
      journal: 'Educational Technology & Society'
    },
    createdAt: new Date('2024-09-07').toISOString(),
    updatedAt: new Date('2024-09-07').toISOString()
  },
  {
    id: randomUUID(),
    projectId: mockProject.id,
    ownerId: DEMO_USER_ID,
    kind: 'TEXT',
    status: 'READY',
    metadata: {
      title: 'Research Notes: Student Engagement Patterns',
      contentType: 'Research Notes'
    },
    createdAt: new Date('2024-09-10').toISOString(),
    updatedAt: new Date('2024-09-10').toISOString()
  }
];

// Mock drafts for first two sections
const mockDrafts = [
  {
    id: randomUUID(),
    projectId: mockProject.id,
    sectionId: mockProject.constitution.outline.sections[0].id, // Introduction
    html: `<h1>Introduction</h1>

<h2>Background and Context</h2>

<p>The integration of artificial intelligence (AI) into educational settings represents one of the most significant technological shifts in modern pedagogy. As educational institutions worldwide grapple with increasing student-to-teacher ratios, diverse learning needs, and the demand for personalized instruction, AI-powered learning assistants have emerged as a promising solution to enhance educational outcomes at scale [CITE:${mockSources[0].id}].</p>

<p>Traditional classroom instruction, while valuable, often struggles to accommodate the varied learning paces and styles of individual students. Research has consistently demonstrated that personalized, one-on-one tutoring produces significant learning gains compared to conventional group instruction [CITE:${mockSources[1].id}]. However, the resource constraints of providing human tutors to all students make this approach economically unfeasible for most educational institutions.</p>

<h2>The Promise of AI in Education</h2>

<p>AI-powered learning assistants offer a potential solution to this scalability challenge by providing adaptive, personalized instruction to unlimited numbers of students simultaneously. These systems leverage machine learning algorithms to understand individual student knowledge gaps, learning preferences, and progress patterns, adjusting instructional content and pacing accordingly [CITE:${mockSources[2].id}].</p>

<p>Recent advances in natural language processing, knowledge representation, and adaptive learning algorithms have enabled the development of sophisticated tutoring systems capable of engaging students in meaningful educational dialogue, providing immediate feedback, and scaffolding complex problem-solving processes. Early implementations have shown promising results, with some studies reporting learning gains comparable to human tutoring in specific domains.</p>

<h2>Research Gap and Significance</h2>

<p>Despite growing interest and investment in AI-powered educational technology, significant questions remain about the actual impact of these systems on student learning outcomes, engagement, and long-term academic success. Much of the existing research focuses on specific AI systems in controlled laboratory settings, with limited investigation of real-world classroom implementation and sustained educational impact.</p>

<p>Furthermore, there is insufficient understanding of the pedagogical factors that determine AI tutoring system effectiveness. Questions about optimal system design, integration with human instruction, subject matter applicability, and student population suitability remain largely unexplored in comprehensive empirical research.</p>

<h2>Research Questions and Objectives</h2>

<p>This thesis addresses these gaps through a comprehensive investigation of AI-powered learning assistants in authentic higher education settings. Specifically, this research examines:</p>

<ul>
<li>How do AI-powered learning assistants affect student engagement and motivation in undergraduate STEM courses?</li>
<li>What is the measurable impact on academic performance across different subject areas and student populations?</li>
<li>What key factors determine the effectiveness of AI tutoring systems in real-world educational contexts?</li>
<li>How do students and educators perceive the integration of AI assistants in learning environments?</li>
</ul>

<h2>Thesis Structure</h2>

<p>This thesis is organized into eight chapters. Following this introduction, Chapter 2 presents a comprehensive review of relevant literature on AI in education, learning theories, and educational technology effectiveness. Chapter 3 details the mixed-methods research design employed in this study. Chapter 4 describes the AI learning assistant system architecture and implementation. Chapters 5 and 6 present quantitative and qualitative findings respectively. Chapter 7 discusses these findings in context of existing research and theoretical frameworks. Chapter 8 concludes with implications, limitations, and future research directions.</p>`,
    citations: [
      {
        sourceId: mockSources[0].id,
        text: 'Holmes, W., Bialik, M., & Fadel, C. (2023). Artificial Intelligence in Education: Promises and Implications.'
      },
      {
        sourceId: mockSources[1].id,
        text: 'Kulik, J.A., & Fletcher, J.D. (2022). The effectiveness of intelligent tutoring systems: A meta-analysis. Review of Educational Research.'
      },
      {
        sourceId: mockSources[2].id,
        text: 'Xie, H., Chu, H., Hwang, G., & Wang, C. (2023). Personalized learning through AI: Current practices and future directions. Educational Technology & Society.'
      }
    ],
    annotations: [],
    createdAt: new Date('2024-10-15').toISOString(),
    updatedAt: new Date('2024-10-20').toISOString()
  },
  {
    id: randomUUID(),
    projectId: mockProject.id,
    sectionId: mockProject.constitution.outline.sections[1].id, // Literature Review
    html: `<h1>Literature Review</h1>

<h2>Theoretical Foundations of AI in Education</h2>

<p>The application of artificial intelligence in educational contexts is grounded in several established learning theories and pedagogical frameworks. Constructivist learning theory, which emphasizes active knowledge construction through experience and reflection, provides a theoretical foundation for adaptive AI systems that scaffold student learning through personalized interactions [CITE:${mockSources[0].id}].</p>

<p>Zone of Proximal Development (ZPD), introduced by Vygotsky, is particularly relevant to AI tutoring systems. These systems aim to identify the gap between what students can accomplish independently and what they can achieve with guidance, providing targeted support at the appropriate difficulty level. Effective AI assistants continuously assess student understanding and adjust instructional content to maintain optimal challenge levels within each learner's ZPD.</p>

<h2>Evolution of Intelligent Tutoring Systems</h2>

<p>Intelligent Tutoring Systems (ITS) have evolved significantly since their inception in the 1970s. Early systems, such as SCHOLAR and SOPHIE, demonstrated the potential of computer-based personalized instruction but were limited by computational constraints and rigid knowledge representation methods. Modern AI-powered systems leverage advances in machine learning, natural language processing, and cognitive modeling to create more flexible and responsive learning environments [CITE:${mockSources[1].id}].</p>

<p>Contemporary ITS architectures typically include four main components: a domain model representing subject matter knowledge, a student model tracking individual learner characteristics and progress, a pedagogical model determining instructional strategies, and a user interface managing human-computer interaction. Recent systems integrate large language models to enable more natural dialogue and sophisticated response generation.</p>

<h2>Empirical Evidence of Effectiveness</h2>

<p>Meta-analytic reviews of ITS effectiveness have generally reported positive outcomes, though with considerable variation across studies and contexts. Kulik and Fletcher's (2022) comprehensive meta-analysis of 50 experimental studies found an average effect size of d = 0.42 for ITS interventions on learning outcomes, indicating moderate positive impact [CITE:${mockSources[1].id}]. However, effectiveness varied substantially based on system design quality, subject domain, implementation fidelity, and student population characteristics.</p>

<p>Subject-specific research has revealed differential effectiveness across domains. Mathematics and science subjects have shown particularly strong results, likely due to the structured nature of these disciplines and clear solution paths. Language learning and writing instruction have proven more challenging for AI systems, though recent natural language processing advances show promise in these areas [CITE:${mockSources[2].id}].</p>

<h2>Student Engagement and Motivation</h2>

<p>Beyond academic performance metrics, research has examined AI tutoring systems' impact on student engagement and motivation. Studies using self-determination theory frameworks have found that well-designed AI assistants can support all three psychological needs: autonomy (through self-paced learning), competence (through appropriate challenge levels and immediate feedback), and relatedness (through responsive, personalized interactions).</p>

<p>However, concerns about reduced human interaction and potential student dependence on AI systems have been raised. Some research suggests that excessive reliance on AI assistance may reduce students' development of independent problem-solving skills and metacognitive strategies. The optimal balance between AI support and student autonomy remains an active area of investigation.</p>

<h2>Implementation Challenges and Barriers</h2>

<p>Despite theoretical promise and empirical support, widespread adoption of AI-powered learning assistants faces numerous challenges. Technical barriers include integration with existing learning management systems, data privacy concerns, and system maintenance requirements. Pedagogical challenges involve training educators to effectively incorporate AI tools, aligning AI-generated content with curriculum standards, and ensuring equitable access across diverse student populations.</p>

<p>Research has identified educator acceptance as a critical factor in successful implementation. Teachers' perceptions of AI systems' value, concerns about job displacement, and confidence in technology use significantly influence adoption and integration quality. Professional development programs that address these concerns and provide hands-on training have shown promise in improving implementation outcomes.</p>

<h2>Summary and Research Gaps</h2>

<p>The literature demonstrates substantial potential for AI-powered learning assistants to enhance educational outcomes, with theoretical grounding in established learning theories and growing empirical evidence of effectiveness. However, significant gaps remain in understanding long-term impacts, optimal implementation strategies, and contextual factors affecting success in authentic educational settings. This thesis addresses these gaps through comprehensive investigation of AI tutoring system implementation in real-world undergraduate STEM courses.</p>`,
    citations: [
      {
        sourceId: mockSources[0].id,
        text: 'Holmes, W., Bialik, M., & Fadel, C. (2023). Artificial Intelligence in Education: Promises and Implications.'
      },
      {
        sourceId: mockSources[1].id,
        text: 'Kulik, J.A., & Fletcher, J.D. (2022). The effectiveness of intelligent tutoring systems: A meta-analysis. Review of Educational Research.'
      },
      {
        sourceId: mockSources[2].id,
        text: 'Xie, H., Chu, H., Hwang, G., & Wang, C. (2023). Personalized learning through AI: Current practices and future directions. Educational Technology & Society.'
      }
    ],
    annotations: [],
    createdAt: new Date('2024-10-25').toISOString(),
    updatedAt: new Date('2024-10-28').toISOString()
  }
];

// Main seeding function
async function seedMockThesis() {
  console.log('🌱 Starting mock thesis data seeding...\n');

  try {
    // 1. Create project
    console.log('📚 Creating project:', mockProject.title);
    await db.collection('projects').doc(mockProject.id).set(mockProject);
    console.log('✅ Project created with ID:', mockProject.id);
    console.log(`   - ${mockProject.constitution.outline.sections.length} sections in outline`);
    console.log(`   - Target word count: ${mockProject.targetWordCount}`);
    console.log(`   - Citation style: ${mockProject.citationStyle}\n`);

    // 2. Create sources
    console.log('📄 Creating sources...');
    for (const source of mockSources) {
      await db.collection('sources').doc(source.id).set(source);
      console.log(`✅ Source: ${source.metadata.title}`);
    }
    console.log(`   Total: ${mockSources.length} sources created\n`);

    // 3. Create drafts
    console.log('✍️  Creating draft sections...');
    for (const draft of mockDrafts) {
      const sectionIndex = mockProject.constitution.outline.sections.findIndex(
        s => s.id === draft.sectionId
      );
      const sectionTitle = mockProject.constitution.outline.sections[sectionIndex]?.title || 'Unknown';

      await db.collection('drafts').doc(draft.id).set(draft);
      console.log(`✅ Draft: ${sectionTitle}`);
      console.log(`   - Word count: ~${draft.html.split(/\s+/).length}`);
      console.log(`   - Citations: ${draft.citations.length}`);
    }
    console.log(`   Total: ${mockDrafts.length} drafts created\n`);

    // 4. Summary
    console.log('🎉 Mock thesis data seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   Project ID: ${mockProject.id}`);
    console.log(`   Owner: ${DEMO_USER_ID}`);
    console.log(`   Sections: ${mockProject.constitution.outline.sections.length}`);
    console.log(`   Sources: ${mockSources.length}`);
    console.log(`   Drafts: ${mockDrafts.length}/${mockProject.constitution.outline.sections.length}`);
    console.log('\n💡 You can now:');
    console.log('   - View the project in workspace');
    console.log('   - Edit existing drafts (Introduction, Literature Review)');
    console.log('   - Generate drafts for remaining sections');
    console.log('   - Export the thesis to DOCX');
    console.log('   - Test the project selector with multiple projects\n');

  } catch (error) {
    console.error('❌ Error seeding mock thesis:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

// Run the seeder
seedMockThesis();
