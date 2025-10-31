// Quick script to check projects in Firestore emulator
import admin from 'firebase-admin';

// Initialize Firebase Admin with emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({
  projectId: 'thesis-copilot-dev'
});

const db = admin.firestore();

async function checkProjects() {
  try {
    const snapshot = await db.collection('projects').get();

    console.log(`\n📊 Total projects in database: ${snapshot.size}\n`);

    if (snapshot.empty) {
      console.log('❌ No projects found in database\n');
      return;
    }

    snapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`Project ${index + 1}:`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Title: ${data.title}`);
      console.log(`  Owner ID: ${data.ownerId}`);
      console.log(`  Created: ${data.createdAt}`);
      console.log(`  Updated: ${data.updatedAt}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error checking projects:', error);
  } finally {
    process.exit(0);
  }
}

checkProjects();
