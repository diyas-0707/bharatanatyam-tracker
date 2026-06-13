const webpush = require('web-push');

const PUBLIC_VAPID_KEY = 'BI_wd-lRgyALbvn2UPBT0fUrcgfHblMfwSe3EPJT5cNn_bBOioOqo0PnGZkkELNk-nmGga_4Q0CO-ELJQSaeo8c';

webpush.setVapidDetails(
  'mailto:dsureshwhjr@gmail.com',
  PUBLIC_VAPID_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const { subscription, title, body } = req.body;
  try {
    await webpush.sendNotification(subscription, JSON.stringify({ title, body }));
    res.status(200).json({ ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
