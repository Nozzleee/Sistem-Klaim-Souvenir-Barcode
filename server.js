const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Simpan data tamu di memori (atau bisa pakai file/db untuk permanen)
let guests = []; // {name, qrData, claimed: false, claimTime: null}

// API generate QR code (mengembalikan base64 image)
app.post('/generate-qr', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).send({ error: 'Nama harus diisi' });

  // Data QR yang unik bisa pakai nama + timestamp
  const qrData = `${name}-${Date.now()}`;

  try {
    const qrImage = await QRCode.toDataURL(qrData);
    // Simpan data tamu untuk validasi nanti
    guests.push({ name, qrData, claimed: false, claimTime: null });
    res.json({ qrImage, qrData, name });
  } catch (err) {
    res.status(500).send({ error: 'Gagal generate QR code' });
  }
});

// API scan QR code (validasi klaim)
app.post('/scan-qr', (req, res) => {
  const { qrData } = req.body;
  const guest = guests.find(g => g.qrData === qrData);

  if (!guest) return res.status(404).send({ status: 'fail', message: 'QR code tidak dikenali' });
  if (guest.claimed) return res.json({ status: 'already', message: 'Souvenir sudah diklaim' });

  guest.claimed = true;
  guest.claimTime = new Date().toISOString();
  res.json({ status: 'success', name: guest.name, claimTime: guest.claimTime });
});

// API rekapan klaim
app.get('/recap', (req, res) => {
  res.json(guests);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
