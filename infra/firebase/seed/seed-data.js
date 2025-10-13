#!/usr/bin/env node

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

// Connect to Firebase emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const app = initializeApp({
  projectId: 'demo-thesis-copilot'
});

const db = getFirestore(app);
const auth = getAuth(app);

// Sample user data
const DEMO_USERS = [
  {
    uid: 'user1',
    email: 'student@university.edu',
    displayName: 'Demo Student',
    emailVerified: true
  },
  {
    uid: 'user2', 
    email: 'researcher@university.edu',
    displayName: 'Demo Researcher',
    emailVerified: true
  }
];

// Sample project data
const DEMO_PROJECTS = [
  {
    id: 'project1',
    ownerId: 'user1',
    title: 'AI Impact on Education Technology',
    topic: 'The transformative effects of artificial intelligence on personalized learning platforms in higher education',
    researchQuestions: [
      'How does AI-driven personalization affect student engagement in online learning platforms?',
      'What are the measurable learning outcomes when AI tutoring systems are integrated into university curricula?',
      'What ethical considerations arise from AI-based student performance prediction and intervention systems?'
    ],
    thesisStatement: 'AI-powered educational technology significantly enhances student learning outcomes through personalized instruction, but requires careful ethical oversight to protect student privacy and prevent algorithmic bias.',
    citationStyle: 'APA',
    constitution: {
      scope: 'This research focuses on AI applications in higher education, specifically examining personalized learning platforms, AI tutoring systems, and predictive analytics tools used in university settings. The study will analyze quantitative learning outcomes, student engagement metrics, and qualitative feedback from both students and educators. The scope excludes K-12 education applications and focuses primarily on undergraduate and graduate-level implementations.',
      toneGuidelines: 'This thesis should maintain an objective, analytical academic tone appropriate for educational technology research. Use clear, precise language that is accessible to both education and technology professionals. Emphasize evidence-based conclusions supported by empirical data. Citations should follow APA format consistently, with particular attention to recent developments in AI and education technology literature.',
      coreArgument: 'The central argument posits that artificial intelligence represents a paradigm shift in educational technology that enhances learning outcomes through personalization, but success depends on thoughtful implementation that addresses ethical concerns. The thesis will demonstrate that while AI-driven systems show measurable improvements in student performance and engagement, their deployment must include robust privacy protections and bias mitigation strategies to realize their full educational potential.',
      outline: {
        sections: [
          {
            id: 'introduction',
            title: 'Introduction',
            objective: 'Establish the significance of AI in education, present the research problem, and outline the thesis structure and contributions.',
            expectedLength: 3000
          },
          {
            id: 'literature-review',
            title: 'Literature Review',
            objective: 'Comprehensively review existing research on AI in education, personalized learning systems, and ethical considerations in educational technology.',
            expectedLength: 8000
          },
          {
            id: 'methodology',
            title: 'Research Methodology',
            objective: 'Detail the mixed-methods approach, participant selection, data collection procedures, and analytical frameworks used in the study.',
            expectedLength: 4000
          },
          {
            id: 'ai-personalization-analysis',
            title: 'AI-Driven Personalization Analysis',
            objective: 'Present findings on how AI personalization affects student engagement and learning outcomes in university settings.',
            expectedLength: 6000
          },
          {
            id: 'ethical-implications',
            title: 'Ethical Implications and Privacy Considerations',
            objective: 'Analyze the ethical challenges, privacy concerns, and bias issues identified in AI educational technology implementations.',
            expectedLength: 5000
          },
          {
            id: 'discussion',
            title: 'Discussion and Future Directions',
            objective: 'Synthesize findings, discuss implications for educational practice and policy, and identify areas for future research.',
            expectedLength: 4000
          },
          {
            id: 'conclusion',
            title: 'Conclusion',
            objective: 'Summarize key findings, restate the thesis contribution, and present final recommendations for AI in education.',
            expectedLength: 2000
          }
        ]
      }
    },
    visibility: 'PRIVATE',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-02-01T14:30:00Z')
  },
  {
    id: 'project2',
    ownerId: 'user2',
    title: 'Sustainable Urban Development Patterns',
    topic: 'Analysis of green infrastructure integration in modern urban planning for climate resilience',
    researchQuestions: [
      'How does green infrastructure implementation affect urban heat island effects?',
      'What are the economic benefits of sustainable urban development practices?'
    ],
    citationStyle: 'CHICAGO',
    visibility: 'PRIVATE',
    createdAt: new Date('2024-01-20T09:00:00Z'),
    updatedAt: new Date('2024-01-25T16:45:00Z')
  }
];

async function createDemoUsers() {
  console.log('Creating demo users...');
  
  for (const user of DEMO_USERS) {
    try {
      await auth.createUser(user);
      console.log(`✓ Created user: ${user.email}`);
    } catch (error) {
      if (error.code === 'auth/uid-already-exists') {
        console.log(`- User already exists: ${user.email}`);
      } else {
        console.error(`✗ Error creating user ${user.email}:`, error.message);
      }
    }
  }
}

async function seedFirestore() {
  console.log('Seeding Firestore with demo data...');

  // Seed projects
  for (const project of DEMO_PROJECTS) {
    await db.collection('projects').doc(project.id).set(project);
    console.log(`✓ Created project: ${project.title}`);
  }
}

async function main() {
  try {
    console.log('🌱 Starting Firebase emulator seed process...');
    console.log('Make sure Firebase emulators are running before executing this script.');
    console.log('Run: firebase emulators:start --only auth,firestore\n');

    await createDemoUsers();
    console.log('');
    await seedFirestore();
    
    console.log('\n✅ Seeding completed successfully!');
    console.log('🔗 Access the Firebase UI at: http://localhost:4000');
    console.log('👤 Demo users created:');
    DEMO_USERS.forEach(user => {
      console.log(`   - ${user.email} (${user.displayName})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}