const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { buildCacheEntry, buildFeedEntryDocument, calculateRanking } = require('./feed-ingestion');

admin.initializeApp();

const FEED_INGESTION_ENV_FLAG = process.env.NEXT_PUBLIC_ENABLE_FEED_INGESTION;
const FEED_INGESTION_RUNTIME_FLAG = process.env.FEED_INGESTION_FORCE;
const FEED_INGESTION_TOKEN = process.env.FEED_INGESTION_TOKEN;

const isFeedIngestionEnabled = () => {
  if (FEED_INGESTION_RUNTIME_FLAG === 'true') {
    return true;
  }
  if (FEED_INGESTION_RUNTIME_FLAG === 'false') {
    return false;
  }
  return FEED_INGESTION_ENV_FLAG === 'true';
};

const runLegacyCacheUpdate = async () => {
  const db = admin.firestore();
  const cacheSnapshot = await db.collection('personalized_feed_cache').get();
  const feeds = cacheSnapshot.docs.map((doc) => ({ id: doc.id }));

  const creationSnapshot = await db.collection('creations').where('isPublic', '==', true).get();
  const creations = creationSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const basePopularityScore = (creation) => {
    const likeCount = creation.likeCount || 0;
    const favoriteCount = creation.favoriteCount || 0;
    const shareCount = creation.shareCount || 0;
    const commentCount = creation.commentCount || 0;
    const remakeCount = creation.remakeCount || 0;
    const orderCount = creation.orderCount || 0;
    const engagement = likeCount * 2 + favoriteCount * 3 + shareCount + commentCount * 1.5 + remakeCount * 4;
    const orders = orderCount * 5;
    return engagement + orders * 0.6;
  };

  const calculateRecencyBoost = (createdAt) => {
    if (!createdAt) return 0;
    const createdTime = createdAt.toDate ? createdAt.toDate().getTime() : new Date(createdAt).getTime();
    const ageInHours = (Date.now() - createdTime) / (60 * 60 * 1000);
    if (ageInHours <= 0) return 50;
    return Math.max(0, 50 - Math.log10(ageInHours + 1) * 10);
  };

  const rank = (items) =>
    items
      .map((creation) => ({
        creation,
        score: basePopularityScore(creation) + calculateRecencyBoost(creation.createdAt),
      }))
      .sort((a, b) => b.score - a.score)
      .map((item) => item.creation);

  await Promise.all(
    feeds.map(async (feed) => {
      const popular = rank(creations).slice(0, 50);
      const trending = rank(creations).slice(0, 50);
      await db
        .collection('personalized_feed_cache')
        .doc(feed.id)
        .set(
          {
            popular,
            trending,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
    }),
  );

  console.log('feed.ingestion.legacy_updated', { feeds: feeds.length, creations: creations.length });
  return null;
};

const runFeedIngestion = async (reason = 'scheduled') => {
  const db = admin.firestore();
  const now = new Date();
  const creationsSnapshot = await db.collection('creations').where('isPublic', '==', true).get();

  if (creationsSnapshot.empty) {
    console.log('feed.ingestion.no_creations', { reason });
    return null;
  }

  let successCount = 0;
  let failureCount = 0;

  await Promise.all(
    creationsSnapshot.docs.map(async (doc) => {
      const creation = { id: doc.id, ...doc.data() };

      try {
        const cacheEntry = buildCacheEntry({ creation, now });
        const feedEntry = buildFeedEntryDocument({ creation, cacheEntry, now });
        const ranking = calculateRanking({ creation, now });

        await db.collection('personalized_feed_cache').doc(creation.id).set(
          {
            ...cacheEntry,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        await db.collection('feed_entries').doc(creation.id).set(
          {
            ...feedEntry,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true },
        );

        console.log('feed.ingestion.success', {
          reason,
          creationId: creation.id,
          score: ranking.score,
        });
        successCount += 1;
      } catch (error) {
        console.error('feed.ingestion.failure', {
          reason,
          creationId: creation.id,
          error: error.message,
        });
        failureCount += 1;
      }
    }),
  );

  console.log('feed.ingestion.summary', { reason, total: creationsSnapshot.size, successCount, failureCount });
  return null;
};

exports.processStorageCleanupQueue = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    const db = admin.firestore();
    const batchSize = 50;
    const snapshot = await db.collection('storage_cleanup_queue')
      .where('status', '==', 'pending')
      .orderBy('createdAt')
      .limit(batchSize)
      .get();

    if (snapshot.empty) {
      console.log('No cleanup tasks to process.');
      return null;
    }

    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const bucket = admin.storage().bucket();

    await Promise.all(tasks.map(async task => {
      try {
        await bucket.file(task.path).delete({ ignoreNotFound: true });
        await db.collection('storage_cleanup_queue').doc(task.id).update({
          status: 'completed',
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error('Failed to delete', task.path, error);
        await db.collection('storage_cleanup_queue').doc(task.id).update({
          status: 'failed',
          error: error.message,
        });
      }
    }));

    console.log(`Processed ${tasks.length} cleanup tasks.`);
    return null;
  });

exports.updatePersonalizedFeedCache = functions.pubsub.schedule('every 15 minutes').onRun(async () => {
  if (!isFeedIngestionEnabled()) {
    console.log('feed.ingestion.disabled', { reason: 'flag_off' });
    return runLegacyCacheUpdate();
  }
  return runFeedIngestion('scheduled');
});

exports.reprocessFeedCache = functions.https.onRequest(async (req, res) => {
  if (!isFeedIngestionEnabled()) {
    res.status(403).json({ error: 'Feed ingestion disabled' });
    return;
  }

  const token = req.headers['x-feed-ingestion-token'] || req.query.token;
  if (FEED_INGESTION_TOKEN && token !== FEED_INGESTION_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    await runFeedIngestion('manual');
    res.json({ ok: true });
  } catch (error) {
    console.error('feed.ingestion.reprocess_failure', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});
