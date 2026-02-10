const express = require('express');
const multer = require('multer');
const libre = require('libreoffice-convert');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3000;

// Promisify the libre.convert function
const convertAsync = promisify(libre.convert);

// CORS: servicio interno de Docker, solo recibe tráfico de funDocs server-side
app.use(cors());

app.use(express.json());

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept DOCX files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only .docx files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'PDF Converter API is running' });
});

// Main conversion endpoint
app.post('/convert', upload.single('file'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please provide a DOCX file in the request'
      });
    }

    console.log(`Converting file: ${req.file.originalname}`);

    // Get the DOCX buffer from multer
    const docxBuffer = req.file.buffer;

    // Convert DOCX to PDF using LibreOffice
    const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);

    // Set appropriate headers for PDF download
    const filename = req.file.originalname.replace('.docx', '.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF buffer
    res.send(pdfBuffer);

    console.log(`Successfully converted: ${req.file.originalname} -> ${filename}`);

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({
      error: 'Conversion failed',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'File size cannot exceed 10MB'
      });
    }
  }

  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`PDF Converter API listening on port ${PORT}`);
});
