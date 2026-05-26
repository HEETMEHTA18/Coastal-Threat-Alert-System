const { Client } = require('pg');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Force Node to prefer IPv4 DNS resolution to avoid Neon connection timeouts
require('dns').setDefaultResultOrder('ipv4first');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

async function getGeminiEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
  const response = await axios.post(url, {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text: text || 'empty report' }]
    }
  }, { timeout: 10000 });

  const embedding = response.data?.embedding?.values;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error('Failed to retrieve embedding values from Gemini API response');
  }
  return embedding;
}

async function ingest() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database for embeddings ingestion');

    // Query all reports
    const res = await client.query('SELECT id, title, description FROM "EnvironmentalReport" ORDER BY "createdAt" DESC');
    const reports = res.rows;
    console.log(`🚀 Ingesting Gemini embeddings for ${reports.length} reports into pgvector...`);

    for (const r of reports) {
      try {
        const text = `${r.title || ''}\n${r.description || ''}`.trim();
        const emb = await getGeminiEmbedding(text);
        
        // Format vector for postgres pgvector insertion: [x,y,z,...]
        const vectorStr = `[${emb.join(',')}]`;
        
        await client.query(`
          INSERT INTO "ReportEmbeddingVector" ("reportId", "embedding")
          VALUES ($1, $2::vector)
          ON CONFLICT ("reportId") DO UPDATE SET "embedding" = EXCLUDED."embedding";
        `, [r.id, vectorStr]);

        console.log(`✅ Indexed report ${r.id} - ${r.title.substring(0, 20)}...`);
        
        // Avoid hitting Gemini API rate limits
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error(`❌ Failed to index report ${r.id}:`, err.message);
      }
    }
    console.log('🎉 Ingestion complete');
  } catch (err) {
    console.error('Ingest error:', err.message);
  } finally {
    await client.end();
  }
}

ingest();
