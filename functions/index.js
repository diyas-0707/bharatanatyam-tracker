const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ── HELPER: send push to a user ──
async function sendPush(userId, title, body, data = {}) {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) return;
  const tokens = userDoc.data().fcmTokens || [];
  if (!tokens.length) return;

  // Save in-app notification
  await db.collection("notifications").add({
    userId,
    title,
    body,
    data,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Send push to all devices
  const messages = tokens.map((token) => ({
    token,
    notification: { title, body },
    data: { ...data },
    apns: { payload: { aps: { badge: 1, sound: "default" } } },
    android: { notification: { sound: "default" } },
  }));

  const results = await Promise.allSettled(
    messages.map((m) => messaging.send(m))
  );

  // Clean up invalid tokens
  const invalidTokens = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") invalidTokens.push(tokens[i]);
  });
  if (invalidTokens.length) {
    const validTokens = tokens.filter((t) => !invalidTokens.includes(t));
    await db.collection("users").doc(userId).update({ fcmTokens: validTokens });
  }
}

// ── 1. STUDENT SUBMITS ASSIGNMENT → notify teacher ──
exports.onSubmission = functions.firestore
  .document("classes/{classId}/submissions/{subId}")
  .onCreate(async (snap, context) => {
    const sub = snap.data();
    const classDoc = await db
      .collection("classes")
      .doc(context.params.classId)
      .get();
    if (!classDoc.exists) return;
    const teacherId = classDoc.data().teacherId;
    const className = classDoc.data().name;
    await sendPush(
      teacherId,
      "📎 New Submission",
      `${sub.studentName} submitted work for ${className}`,
      { type: "submission", classId: context.params.classId }
    );
  });

// ── 2. STUDENT LOGS PRACTICE → notify teacher ──
exports.onPracticeLog = functions.firestore
  .document("practiceLogs/{logId}")
  .onCreate(async (snap) => {
    const log = snap.data();
    if (!log.studentId) return;
    // Find all classes this student is in
    const classSnap = await db
      .collection("classes")
      .where("studentIds", "array-contains", log.studentId)
      .get();
    for (const cd of classSnap.docs) {
      await sendPush(
        cd.data().teacherId,
        "📝 Practice Logged",
        `${log.studentName} logged a practice session`,
        { type: "log", studentId: log.studentId }
      );
    }
  });

// ── 3. TEACHER GIVES FEEDBACK → notify student ──
exports.onFeedback = functions.firestore
  .document("classes/{classId}/feedback/{studentId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    const fb = change.after.data();
    await sendPush(
      context.params.studentId,
      "💬 New Feedback",
      `${fb.teacherName} gave you feedback`,
      { type: "feedback", classId: context.params.classId }
    );
  });

// ── 4. TEACHER GIVES LOG FEEDBACK → notify student ──
exports.onLogFeedback = functions.firestore
  .document("classes/{classId}/logFeedback/{logId}")
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;
    const fb = change.after.data();
    if (!fb.studentId) return;
    await sendPush(
      fb.studentId,
      "💬 Feedback on your log",
      `${fb.teacherName} commented on your practice entry`,
      { type: "logFeedback", classId: context.params.classId }
    );
  });

// ── 5. NEW CHAT MESSAGE → notify recipient ──
exports.onChatMessage = functions.firestore
  .document("chats/{chatId}/messages/{msgId}")
  .onCreate(async (snap, context) => {
    const msg = snap.data();
    if (!msg.senderId) return;
    // chatId is uid1_uid2 sorted
    const [uid1, uid2] = context.params.chatId.split("_");
    const recipientId = msg.senderId === uid1 ? uid2 : uid1;
    await sendPush(
      recipientId,
      "💬 New Message",
      `${msg.senderName}: ${msg.text.substring(0, 80)}`,
      { type: "chat", chatId: context.params.chatId }
    );
  });

// ── 6. TEACHER POSTS ANNOUNCEMENT → notify all students ──
exports.onAnnouncement = functions.firestore
  .document("classes/{classId}/announcements/{annId}")
  .onCreate(async (snap, context) => {
    const ann = snap.data();
    if (ann._system) return; // skip system messages
    const classDoc = await db
      .collection("classes")
      .doc(context.params.classId)
      .get();
    if (!classDoc.exists) return;
    const studentIds = classDoc.data().studentIds || [];
    for (const sid of studentIds) {
      await sendPush(
        sid,
        `📢 ${classDoc.data().name}`,
        `${ann.teacherName}: ${ann.body.substring(0, 80)}`,
        { type: "announcement", classId: context.params.classId }
      );
    }
  });

// ── 7. TEACHER POSTS ASSIGNMENT → notify all students ──
exports.onAssignment = functions.firestore
  .document("classes/{classId}/assignments/{assignId}")
  .onCreate(async (snap, context) => {
    const assign = snap.data();
    const classDoc = await db
      .collection("classes")
      .doc(context.params.classId)
      .get();
    if (!classDoc.exists) return;
    const studentIds = classDoc.data().studentIds || [];
    for (const sid of studentIds) {
      await sendPush(
        sid,
        `📚 New Assignment — ${classDoc.data().name}`,
        `${assign.teacherName}: ${assign.title}`,
        { type: "assignment", classId: context.params.classId }
      );
    }
  });