import express from 'express';
import cors from 'cors';
import twilio from 'twilio';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken  = process.env.TWILIO_AUTH_TOKEN;
const fromPhone  = process.env.TWILIO_PHONE_NUMBER;
const toPhone    = process.env.TO_PHONE_NUMBER || '+919876543210';

// ── Twilio client init ────────────────────────────────────────────────────────
let twilioClient = null;
let twilioReady  = false;
if (accountSid && authToken && accountSid !== 'placeholder') {
  try {
    twilioClient = twilio(accountSid, authToken);
    twilioReady  = true;
    console.log('[Twilio] Client initialized — real SMS delivery enabled');
  } catch (err) {
    console.warn('[Twilio] Client init warning:', err.message);
  }
} else {
  console.log('[Twilio] No credentials — running in simulation/demo mode');
}

// ── In-memory SMS audit log (last 50 entries) ─────────────────────────────────
const smsLog = [];
function logSmsEntry(entry) {
  smsLog.unshift({ ...entry, loggedAt: new Date().toISOString() });
  if (smsLog.length > 50) smsLog.length = 50;
}

// ── POST /api/send-sms ────────────────────────────────────────────────────────
app.post('/api/send-sms', async (req, res) => {
  const { message, recipient } = req.body ?? {};
  const textBody     = message   || '⚠️ TRIVANDRUM CITY PULSE ALERT: Flood risk escalated to HIGH near Killi River & Thampanoor basin.';
  const targetNumber = recipient || toPhone;

  console.log(`[Twilio] SMS request → ${targetNumber} | "${textBody.slice(0, 60)}..."`);

  if (twilioClient && fromPhone) {
    try {
      const sms = await twilioClient.messages.create({
        body: textBody,
        from: fromPhone,
        to:   targetNumber,
      });

      const result = {
        success:   true,
        simulated: false,
        sid:       sms.sid,
        to:        targetNumber,
        timestamp: new Date().toISOString(),
        message:   `Twilio SMS dispatched to ${targetNumber}`,
      };

      console.log(`[Twilio] ✓ SMS sent — SID: ${sms.sid}`);
      logSmsEntry(result);
      return res.json(result);

    } catch (err) {
      console.error('[Twilio] ✗ SMS error:', err.message);
      const result = {
        success:   false,
        simulated: false,
        error:     err.message,
        to:        targetNumber,
        timestamp: new Date().toISOString(),
        message:   `Twilio SMS delivery failed: ${err.message}`,
      };
      logSmsEntry(result);
      return res.status(500).json(result);
    }
  }

  // ── Demo/simulation fallback ─────────────────────────────────────────────
  const result = {
    success:   true,
    simulated: true,
    sid:       `SIMULATED-${Date.now()}`,
    to:        targetNumber,
    timestamp: new Date().toISOString(),
    message:   `[DEMO] SMS Alert dispatched to ${targetNumber} via Twilio Sandbox`,
  };

  console.log(`[Twilio] ⚙ Simulated SMS to ${targetNumber}`);
  logSmsEntry(result);
  return res.json(result);
});

// ── GET /api/sms-log — returns recent SMS dispatch history ───────────────────
app.get('/api/sms-log', (_req, res) => {
  res.json({ count: smsLog.length, entries: smsLog });
});

// ── GET /api/health ───────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status:       'ok',
    server:       'Trivandrum City Pulse Twilio SMS Server',
    twilioReady,
    simulated:    !twilioReady,
    smsSentCount: smsLog.filter(e => e.success).length,
    uptime:       process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`[Server] Twilio SMS Backend running on port ${PORT}`);
  console.log(`[Server] Twilio ready: ${twilioReady} | Demo/simulated: ${!twilioReady}`);
});
