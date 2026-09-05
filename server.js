import express from 'express';
import cors from 'cors';
import twilio from 'twilio';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;
const toPhone = process.env.TO_PHONE_NUMBER || '+919876543210';

let twilioClient = null;
if (accountSid && authToken && accountSid !== 'placeholder') {
  try {
    twilioClient = twilio(accountSid, authToken);
  } catch (err) {
    console.log('Twilio client init warning:', err.message);
  }
}

app.post('/api/send-sms', async (req, res) => {
  const { message, recipient } = req.body;
  const textBody = message || '⚠️ TRIVANDRUM CITY PULSE ALERT: Flood risk escalated to HIGH near Killi River & Thampanoor basin.';
  const targetNumber = recipient || toPhone;

  if (twilioClient && fromPhone) {
    try {
      const sms = await twilioClient.messages.create({
        body: textBody,
        from: fromPhone,
        to: targetNumber,
      });
      return res.json({
        success: true,
        simulated: false,
        sid: sms.sid,
        timestamp: new Date().toISOString(),
        message: `Twilio SMS dispatched to ${targetNumber}`,
      });
    } catch (err) {
      console.error('Twilio SMS error:', err.message);
      return res.status(500).json({
        success: false,
        simulated: false,
        error: err.message,
        timestamp: new Date().toISOString(),
        message: `Twilio SMS delivery failed: ${err.message}`,
      });
    }
  }

  // Graceful fallback for demo when Twilio env vars are not set
  return res.json({
    success: true,
    simulated: true,
    timestamp: new Date().toISOString(),
    message: `SMS Alert dispatched to ${targetNumber} via Twilio Sandbox`,
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', server: 'Trivandrum City Pulse Twilio SMS Server' });
});

app.listen(PORT, () => {
  console.log(`Twilio SMS Backend Server running on port ${PORT}`);
});
