const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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

exports.updatePersonalizedFeedCache = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    const db = admin.firestore();
    const cacheSnapshot = await db.collection('personalized_feed_cache').get();
    const feeds = cacheSnapshot.docs.map(doc => ({ id: doc.id }));

    const creationSnapshot = await db.collection('creations').where('isPublic', '==', true).get();
    const creations = creationSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

    const rank = (items) => items
      .map((creation) => ({
        creation,
        score: basePopularityScore(creation) + calculateRecencyBoost(creation.createdAt),
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.creation);

    await Promise.all(feeds.map(async feed => {
      const popular = rank(creations).slice(0, 50);
      const trending = rank(creations).slice(0, 50);
      await db.collection('personalized_feed_cache').doc(feed.id).set({
        popular,
        trending,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }));

    console.log('Updated personalized feed cache for', feeds.length, 'feeds.');
    return null;
  });
