import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini on server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route: AI Smart Invoice Generator from natural language prompt or photo/image OCR
app.post('/api/smart-invoice', async (req, res) => {
  try {
    const { promptText, imageBase64, mimeType, currency = 'USD' } = req.body;

    if (!promptText && !imageBase64) {
      return res.status(400).json({ error: 'Either prompt text or an invoice photo is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server' });
    }

    const contents: any[] = [];

    // If an invoice or receipt image was uploaded, attach as inlineData part
    if (imageBase64 && typeof imageBase64 === 'string') {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      const base64Data = match ? match[2] : imageBase64;
      const detectedMime = match ? match[1] : (mimeType || 'image/jpeg');

      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: detectedMime,
        },
      });
    }

    // Add extraction guidance
    contents.push({
      text: `You are an expert AI bookkeeping and Invoice/Receipt OCR extraction assistant.
Extract all possible data from this invoice/receipt photo or user notes into structured JSON.
Preferred currency if not specified: ${currency}.

Carefully extract:
- invoiceNumber: Invoice or receipt reference number (e.g. INV-2026-004)
- issueDate: date in YYYY-MM-DD format
- dueDate: due date in YYYY-MM-DD format (if visible or approximate from terms)
- senderName: Vendor, seller, or issuing company name
- senderEmail, senderPhone, senderAddress, senderTaxId (VAT/TIN/Tax Registration)
- clientName: Buyer, customer, or recipient name
- clientEmail, clientPhone, clientAddress
- items: itemized line items with exact description, quantity, and unit rate
- taxRate: tax percentage (e.g. 5 for 5%, 0 if none)
- discountRate: discount percentage if mentioned
- shippingFee: delivery or shipping charges
- amountPaid: amount already paid or deposit
- paymentInfo: bank account, SWIFT, IBAN, or payment method instructions
- notes and terms: any extra terms or footer notes.
${promptText ? `User added notes: "${promptText}"` : ''}`,
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            invoiceNumber: { type: Type.STRING },
            issueDate: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            senderName: { type: Type.STRING },
            senderEmail: { type: Type.STRING },
            senderPhone: { type: Type.STRING },
            senderAddress: { type: Type.STRING },
            senderTaxId: { type: Type.STRING },
            clientName: { type: Type.STRING },
            clientEmail: { type: Type.STRING },
            clientPhone: { type: Type.STRING },
            clientAddress: { type: Type.STRING },
            currency: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  rate: { type: Type.NUMBER },
                },
                required: ['description', 'quantity', 'rate'],
              },
            },
            taxRate: { type: Type.NUMBER, description: 'Percentage, e.g. 8 for 8%' },
            discountRate: { type: Type.NUMBER, description: 'Percentage, e.g. 5 for 5%' },
            shippingFee: { type: Type.NUMBER },
            amountPaid: { type: Type.NUMBER },
            paymentInfo: { type: Type.STRING },
            paymentTerms: { type: Type.STRING },
            notes: { type: Type.STRING },
          },
          required: ['items'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsed });
  } catch (error: any) {
    console.error('Error generating smart invoice:', error);
    return res.status(500).json({
      error: error.message || 'Failed to extract invoice with AI',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode with Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
