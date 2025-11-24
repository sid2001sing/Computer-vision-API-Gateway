// server/index.js
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const vision = require('@google-cloud/vision');
const fs = require('fs');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer (Stores file in memory temporarily)
const upload = multer({ storage: multer.memoryStorage() });

// Configure Google Cloud Vision Client
const client = new vision.ImageAnnotatorClient({
  keyFilename: './service-account.json' // Path to your key
});

// THE GATEWAY ROUTE
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    console.log('Processing multi-feature analysis...');

    // We request 3 specific features now:
    const [result] = await client.annotateImage({
      image: { content: req.file.buffer },
      features: [
        { type: 'LABEL_DETECTION' },
        { type: 'TEXT_DETECTION' },
        { type: 'SAFE_SEARCH_DETECTION' } // Detects violence, adult content, etc.
      ]
    });

    // 1. Process Labels
    const labels = result.labelAnnotations.map(label => ({
      description: label.description,
      confidence: (label.score * 100).toFixed(1) + '%'
    }));

    // 2. Process Text (OCR)
    // textAnnotations[0] usually contains the full block of text
    const fullText = result.textAnnotations && result.textAnnotations.length > 0
      ? result.textAnnotations[0].description
      : null;

    // 3. Process Safe Search
    const safeSearch = result.safeSearchAnnotation || {};

    // Send the combined rich data back
    res.json({ 
      success: true, 
      data: {
        labels: labels.slice(0, 5), // Top 5 tags
        text: fullText ? fullText : "No text detected in image.",
        safety: {
          adult: safeSearch.adult,
          violence: safeSearch.violence,
          racy: safeSearch.racy
        }
      } 
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Gateway Server running on http://localhost:${port}`);
});
