const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const webpush = require('web-push');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  })
});
const db = getFirestore(app);

const PUBLIC_VAPID = 'BI_wd-lRgyALbvn2UPBT0fUrcgfHblMfwSe3EPJT5cNn_bBOioOqo0PnGZkkELNk-nmGga_4Q0CO-ELJQSaeo8c';

webpush.setVapidDetails('mailto:dsureshwhjr@gmail.com', PUBLIC_VAPID, process.env.VAPID_PRIVATE_KEY);

module.exports = async (req, res) => {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).end();
  }

  const now = new Date();
  const todayDay = now.getDate();
  const todayHour = now.getHours();
  const todayMin = now.getMinutes();
  const ms = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}`;

  const usersSnap = await db.collection('users').where('role','==','teacher').get();
  let sent = 0;

  for (const teacherDoc of usersSnap.docs) {
    const data = teacherDoc.data();
    const s = data.summarySettings;
    if (!s?.day || !s?.time) continue;

    const [schedHour, schedMin] = s.time.split(':').map(Number);
    if (s.day !== todayDay) continue;
    if (schedHour !== todayHour) continue;
    if (Math.abs(schedMin - todayMin) > 5) continue; // 5 min tolerance

    // Already sent this month?
    const lastSent = s.lastSentAt?.toDate?.();
    if (lastSent) {
      const lastMs = `${lastSent.getFullYear()}-${(lastSent.getMonth()+1).toString().padStart(2,'0')}`;
      if (lastMs === ms) continue;
    }

    // Get all classes for this teacher
    const classSnap = await db.collection('classes').where('teacherId','==',teacherDoc.id).get();
    for (const cd of classSnap.docs) {
      for (const uid of cd.data().studentIds||[]) {
        const udoc = await db.collection('users').doc(uid).get();
        if (!udoc.exists || udoc.data().role !== 'parent') continue;
        const sub = udoc.data().pushSub;
        if (!sub) continue;
        const prefs = udoc.data().notifPrefs||{};
        if (prefs.summaryOpen === false) continue;
        try {
          await webpush.sendNotification(sub, JSON.stringify({
            title: 'Monthly Summary',
            body: `${data.displayName||'Your teacher'} sent the monthly summary for ${cd.data().name}. Fill it out within 24 hours.`,
            url: '/?screen=summary'
          }));
          sent++;
        } catch(e) { console.warn('push failed', uid, e.message); }
      }
    }

    // Mark as sent
    await db.collection('users').doc(teacherDoc.id).update({
      'summarySettings.lastSentAt': new Date()
    });
  }

  res.status(200).json({ ok: true, sent });
};
