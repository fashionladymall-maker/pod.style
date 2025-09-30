import 'dotenv/config';
import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

type CacheDoc = {
  id: string;
  creationId: string;
  region: string;
  locale: string;
  rankingSignals: { engagementScore: number; recencyBoost: number };
  personaVector: number[];
  updatedAt?: FirebaseFirestore.Timestamp;
};

function bootstrapFirebase() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
      initializeApp({ credential });
      return;
    } catch (error) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT must be valid JSON.');
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_EMULATOR_HOST) {
    initializeApp({ credential: applicationDefault() });
    return;
  }

  throw new Error(
    'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT, GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_EMULATOR_HOST before running the seeding script.',
  );
}

async function seedPersonalizedFeedCache() {
  bootstrapFirebase();
  const db = getFirestore();
  const batch = db.batch();

  const docs: CacheDoc[] = [
    {
      id: 'beta-cache-1',
      creationId: 'creation-trendy-1',
      region: 'US',
      locale: 'en-US',
      rankingSignals: { engagementScore: 72, recencyBoost: 15 },
      personaVector: [0.4, 0.3, 0.1, 0.2],
      updatedAt: Timestamp.now(),
    },
    {
      id: 'beta-cache-2',
      creationId: 'creation-styled-2',
      region: 'CN',
      locale: 'zh-CN',
      rankingSignals: { engagementScore: 55, recencyBoost: 28 },
      personaVector: [0.2, 0.2, 0.5, 0.1],
      updatedAt: Timestamp.now(),
    },
    {
      id: 'beta-cache-3',
      creationId: 'creation-fresh-3',
      region: 'EU',
      locale: 'en-GB',
      rankingSignals: { engagementScore: 61, recencyBoost: 12 },
      personaVector: [0.3, 0.4, 0.2, 0.1],
      updatedAt: Timestamp.now(),
    },
  ];

  docs.forEach((doc) => {
    const { id, updatedAt, ...rest } = doc;
    const ref = db.collection('personalized_feed_cache').doc(id);
    batch.set(ref, { ...rest, updatedAt: updatedAt ?? Timestamp.now() }, { merge: true });
  });

  await batch.commit();
  console.log(`Seeded ${docs.length} personalized_feed_cache documents.`);
}

seedPersonalizedFeedCache()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Failed to seed personalized_feed_cache:', error);
    process.exit(1);
  });
