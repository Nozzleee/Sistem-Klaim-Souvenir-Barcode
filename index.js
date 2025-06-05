const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const qrcode = require('qrcode');
const path = require('path');

const app = express();
const PORT = 3000;
const GUESTS_FILE = './guests.json';

app.use(bodyParser.json());
app.use(express.static('public'));

// Helper: Baca data tamu dari file
function loadGuests() {
  try {
    const data = fs.readFileSync(GUESTS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper: Simpan data tamu ke file
function saveGuests(guests) {
  fs.writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2));
}

// Generate QR untuk tamu baru
app.post('/generate-qr', async (req, res) => {
  const { name, category } = req.body;
  const guests = loadGuests();

  const qrData = `${category}-${name}-${Date.now()}`;

  try {
    const qrImage = await qrcode.toDataURL(qrData);
    guests.push({ name, category, qrData, claimed: false });
    saveGuests(guests);
    res.json({ name, category, qrImage });
  } catch (err) {
    res.status(500).json({ error: 'Gagal generate QR code' });
  }
});

// Validasi scan QR tamu
app.post('/scan-qr', (req, res) => {
  const { qrData } = req.body;
  const guests = loadGuests();

  const guest = guests.find(g => g.qrData === qrData);

  if (!guest) {
    return res.status(404).json({ status: 'fail', message: 'QR code tidak dikenali' });
  }

  if (guest.claimed) {
    return res.json({ status: 'already', name: guest.name });
  }

  guest.claimed = true;
  guest.claimTime = new Date().toISOString();
  saveGuests(guests);

  res.json({ status: 'success', name: guest.name, claimTime: guest.claimTime });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
