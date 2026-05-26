const { Pool } = require('pg');

let pool = null;

// Relational tables initialization SQL query
const INIT_SCHEMA_SQL = `
-- Create User Table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'viewer',
  "status" TEXT NOT NULL DEFAULT 'active',
  "organization" TEXT,
  "department" TEXT,
  "phone" TEXT,
  "region" TEXT,
  "latitude" DOUBLE PRECISION,
  "longitude" DOUBLE PRECISION,
  "canCreateAlerts" BOOLEAN DEFAULT false,
  "canAcknowledgeAlerts" BOOLEAN DEFAULT false,
  "canGenerateReports" BOOLEAN DEFAULT false,
  "canManageUsers" BOOLEAN DEFAULT false,
  "canViewDashboard" BOOLEAN DEFAULT true,
  "canAccessAPI" BOOLEAN DEFAULT false,
  "emailNotifications" BOOLEAN DEFAULT true,
  "smsNotifications" BOOLEAN DEFAULT false,
  "alertCritical" BOOLEAN DEFAULT true,
  "alertWarning" BOOLEAN DEFAULT true,
  "alertInfo" BOOLEAN DEFAULT false,
  "dashboardLayout" TEXT,
  "timezone" TEXT DEFAULT 'Asia/Kolkata',
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  "loginCount" INTEGER DEFAULT 0,
  "apiKey" TEXT UNIQUE,
  "resetPasswordToken" TEXT,
  "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create EnvironmentalReport Table
CREATE TABLE IF NOT EXISTS "EnvironmentalReport" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT UNIQUE NOT NULL,
  "reportType" TEXT NOT NULL,
  "severity" TEXT NOT NULL DEFAULT 'medium',
  "status" TEXT NOT NULL DEFAULT 'active',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactPhone" TEXT NOT NULL,
  "contactEmail" TEXT,
  "contactOrganization" TEXT,
  "windSpeed" TEXT,
  "waveHeight" TEXT,
  "temperature" TEXT,
  "weatherVisibility" TEXT,
  "precipitation" TEXT,
  "pressure" TEXT,
  "immediateRisk" BOOLEAN DEFAULT false,
  "affectedArea" TEXT,
  "estimatedPeople" TEXT,
  "evacuationNeeded" BOOLEAN DEFAULT false,
  "infrastructureDamage" BOOLEAN DEFAULT false,
  "smsRadius" DOUBLE PRECISION DEFAULT 5.0,
  "urgentAlert" BOOLEAN DEFAULT false,
  "notifyAuthorities" BOOLEAN DEFAULT true,
  "notifyCommunity" BOOLEAN DEFAULT true,
  "smsSent" INTEGER DEFAULT 0,
  "smsSuccessful" INTEGER DEFAULT 0,
  "smsFailed" INTEGER DEFAULT 0,
  "smsLastSentAt" TIMESTAMP WITH TIME ZONE,
  "verified" BOOLEAN DEFAULT false,
  "verifiedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "verifiedAt" TIMESTAMP WITH TIME ZONE,
  "verificationNotes" TEXT,
  "priority" INTEGER DEFAULT 5,
  "tags" TEXT[] DEFAULT '{}',
  "source" TEXT DEFAULT 'community',
  "visibility" TEXT DEFAULT 'public',
  "followUpRequired" BOOLEAN DEFAULT false,
  "peopleAffected" INTEGER,
  "economicImpact" TEXT,
  "environmentalImpact" TEXT,
  "infrastructureImpact" TEXT,
  "resolvedAt" TIMESTAMP WITH TIME ZONE,
  "resolvedById" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "resolutionNotes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ReportImage Table
CREATE TABLE IF NOT EXISTS "ReportImage" (
  "id" TEXT PRIMARY KEY,
  "url" TEXT NOT NULL,
  "reportId" TEXT REFERENCES "EnvironmentalReport"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create AIAnalysis Table
CREATE TABLE IF NOT EXISTS "AIAnalysis" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT UNIQUE REFERENCES "EnvironmentalReport"("id") ON DELETE CASCADE,
  "severityScore" DOUBLE PRECISION DEFAULT 0.0,
  "detectedIssues" TEXT[] DEFAULT '{}',
  "suggestedAction" TEXT NOT NULL,
  "analysisSummary" TEXT,
  "confidence" DOUBLE PRECISION DEFAULT 1.0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Comment Table
CREATE TABLE IF NOT EXISTS "Comment" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT REFERENCES "EnvironmentalReport"("id") ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "userType" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "action" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Alert Table
CREATE TABLE IF NOT EXISTS "Alert" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Location Table
CREATE TABLE IF NOT EXISTS "Location" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "region" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "radius" DOUBLE PRECISION DEFAULT 10.0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Notification Table
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create TidalData Table
CREATE TABLE IF NOT EXISTS "TidalData" (
  "id" TEXT PRIMARY KEY,
  "stationId" TEXT NOT NULL,
  "stationName" TEXT NOT NULL,
  "waterLevel" DOUBLE PRECISION NOT NULL,
  "tideLevel" DOUBLE PRECISION,
  "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create EnvironmentalMetric Table
CREATE TABLE IF NOT EXISTS "EnvironmentalMetric" (
  "id" TEXT PRIMARY KEY,
  "locationId" TEXT,
  "waterTemp" DOUBLE PRECISION,
  "salinity" DOUBLE PRECISION,
  "chlorophyll" DOUBLE PRECISION,
  "turbidity" DOUBLE PRECISION,
  "pH" DOUBLE PRECISION,
  "dissolvedOxygen" DOUBLE PRECISION,
  "windSpeed" DOUBLE PRECISION,
  "waveHeight" DOUBLE PRECISION,
  "timestamp" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ActivityLog Table
CREATE TABLE IF NOT EXISTS "ActivityLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "action" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create ReportStatusHistory Table
CREATE TABLE IF NOT EXISTS "ReportStatusHistory" (
  "id" TEXT PRIMARY KEY,
  "reportId" TEXT REFERENCES "EnvironmentalReport"("id") ON DELETE CASCADE,
  "status" TEXT NOT NULL,
  "changedById" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "notes" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Questionnaire Table
CREATE TABLE IF NOT EXISTS "Questionnaire" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  "answers" TEXT NOT NULL,
  "score" DOUBLE PRECISION DEFAULT 0.0,
  "riskLevel" TEXT DEFAULT 'low',
  "assessment" TEXT NOT NULL,
  "recommendations" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;

const connectDB = async () => {
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/coastal_guardian';
  console.log('🔌 Initializing PostgreSQL Pool Connection...');

  try {
    pool = new Pool({
      connectionString: dbUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Verify connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');

    // Run schema creation
    console.log('⚙️ Initializing database tables schema...');
    await client.query(INIT_SCHEMA_SQL);
    console.log('✅ Database schema verified / created successfully');
    
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ PostgreSQL connection/initialization failed:', error.message);
    console.warn('💡 App will run in degraded offline/memory mode if database operations fail.');
    return null;
  }
};

// Emulated Prisma Client APIs that query the Postgres Pool
class PrismaEmulator {
  constructor() {
    this.user = {
      findUnique: async (args) => this._findUniqueUser(args),
      findFirst: async (args) => this._findFirstUser(args),
      create: async (args) => this._createUser(args),
      update: async (args) => this._updateUser(args),
      findMany: async (args) => this._findManyUsers(args),
    };

    this.environmentalReport = {
      findMany: async (args) => this._findManyReports(args),
      findFirst: async (args) => this._findFirstReport(args),
      findUnique: async (args) => this._findUniqueReport(args),
      create: async (args) => this._createReport(args),
      update: async (args) => this._updateReport(args),
      delete: async (args) => this._deleteReport(args),
      count: async (args) => this._countReports(args),
    };

    this.aiAnalysis = {
      create: async (args) => this._createAIAnalysis(args),
      findUnique: async (args) => this._findUniqueAIAnalysis(args),
    };

    this.comment = {
      create: async (args) => this._createComment(args),
      findMany: async (args) => this._findManyComments(args),
    };

    this.questionnaire = {
      create: async (args) => this._createQuestionnaire(args),
      findMany: async (args) => this._findManyQuestionnaires(args),
    };

    this.tidalData = {
      create: async (args) => this._createTidalData(args),
      findMany: async (args) => this._findManyTidalData(args),
    };

    this.environmentalMetric = {
      create: async (args) => this._createEnvironmentalMetric(args),
      findMany: async (args) => this._findManyEnvironmentalMetrics(args),
    };
  }

  async _runQuery(sql, params = []) {
    if (!pool) {
      throw new Error("PostgreSQL pool is not initialized. Call connectDB() first.");
    }
    const result = await pool.query(sql, params);
    return result;
  }

  // Raw-query compatibility for code paths that still expect Prisma methods.
  async $queryRaw(strings, ...values) {
    if (Array.isArray(strings) && strings.raw) {
      const text = strings.reduce((acc, str, idx) => acc + str + (idx < values.length ? `$${idx + 1}` : ''), '');
      return (await this._runQuery(text, values)).rows;
    }
    if (typeof strings === 'string') {
      return (await this._runQuery(strings, values)).rows;
    }
    throw new Error('Unsupported $queryRaw invocation');
  }

  async $queryRawUnsafe(sql, ...params) {
    return (await this._runQuery(sql, params)).rows;
  }

  async $executeRawUnsafe(sql, ...params) {
    const result = await this._runQuery(sql, params);
    return result.rowCount;
  }

  // --- USER OPERATIONS ---
  async _findUniqueUser(args) {
    if (args.where.email) {
      const res = await this._runQuery('SELECT * FROM "User" WHERE email = $1 LIMIT 1', [args.where.email.toLowerCase()]);
      return res.rows[0] || null;
    }
    if (args.where.id) {
      const res = await this._runQuery('SELECT * FROM "User" WHERE id = $1 LIMIT 1', [args.where.id]);
      return res.rows[0] || null;
    }
    return null;
  }

  async _findFirstUser(args) {
    return this._findUniqueUser(args);
  }

  async _createUser(args) {
    const d = args.data;
    const fields = [];
    const placeholders = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(d)) {
      fields.push(`"${key}"`);
      placeholders.push(`$${i++}`);
      values.push(value);
    }

    const sql = `INSERT INTO "User" (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const res = await this._runQuery(sql, values);
    return res.rows[0];
  }

  async _updateUser(args) {
    const id = args.where.id;
    const d = args.data;
    const setClauses = [];
    const values = [id];
    let i = 2;

    for (const [key, value] of Object.entries(d)) {
      setClauses.push(`"${key}" = $${i++}`);
      values.push(value);
    }

    const sql = `UPDATE "User" SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
    const res = await this._runQuery(sql, values);
    return res.rows[0];
  }

  async _findManyUsers(args = {}) {
    const res = await this._runQuery('SELECT * FROM "User"');
    return res.rows;
  }

  // --- REPORT OPERATIONS ---
  async _findManyReports(args = {}) {
    let sql = 'SELECT r.*, row_to_json(ai.*) as "aiAnalysis" FROM "EnvironmentalReport" r LEFT JOIN "AIAnalysis" ai ON r.id = ai."reportId"';
    const params = [];
    const whereClauses = [];
    let i = 1;

    if (args.where) {
      const w = args.where;
      if (w.reportType) {
        whereClauses.push(`r."reportType" = $${i++}`);
        params.push(w.reportType);
      }
      if (w.severity) {
        whereClauses.push(`r.severity = $${i++}`);
        params.push(w.severity);
      }
      if (w.status) {
        whereClauses.push(`r.status = $${i++}`);
        params.push(w.status);
      }
      if (w.createdAt && w.createdAt.gte) {
        whereClauses.push(`r."createdAt" >= $${i++}`);
        params.push(w.createdAt.gte);
      }
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    // Sorting
    sql += ' ORDER BY r.priority DESC, r."createdAt" DESC';

    // Pagination
    if (args.take) {
      sql += ` LIMIT ${args.take}`;
    }
    if (args.skip) {
      sql += ` OFFSET ${args.skip}`;
    }

    const res = await this._runQuery(sql, params);
    
    // Format response to include nested objects if needed
    return res.rows.map(row => {
      const { aiAnalysis, ...report } = row;
      if (aiAnalysis && aiAnalysis.id) {
        report.aiAnalysis = aiAnalysis;
      } else {
        report.aiAnalysis = null;
      }
      // Mock populate verification fields
      report.verification = {
        verified: report.verified,
        verifiedAt: report.verifiedAt,
        verificationNotes: report.verificationNotes
      };
      return report;
    });
  }

  async _findFirstReport(args) {
    const reports = await this._findManyReports(args);
    return reports[0] || null;
  }

  async _findUniqueReport(args) {
    const id = args.where.id || args.where.reportId;
    const field = args.where.id ? 'id' : 'reportId';
    const sql = `SELECT r.*, row_to_json(ai.*) as "aiAnalysis" FROM "EnvironmentalReport" r LEFT JOIN "AIAnalysis" ai ON r.id = ai."reportId" WHERE r."${field}" = $1 LIMIT 1`;
    const res = await this._runQuery(sql, [id]);
    const row = res.rows[0];
    if (!row) return null;

    const { aiAnalysis, ...report } = row;
    if (aiAnalysis && aiAnalysis.id) {
      report.aiAnalysis = aiAnalysis;
    } else {
      report.aiAnalysis = null;
    }
    return report;
  }

  async _createReport(args) {
    const d = args.data;
    const fields = [];
    const placeholders = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(d)) {
      if (key === 'tags') {
        fields.push(`"${key}"`);
        placeholders.push(`$${i++}`);
        values.push(value || []);
      } else if (typeof value !== 'object') {
        fields.push(`"${key}"`);
        placeholders.push(`$${i++}`);
        values.push(value);
      }
    }

    const sql = `INSERT INTO "EnvironmentalReport" (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const res = await this._runQuery(sql, values);
    return res.rows[0];
  }

  async _updateReport(args) {
    const id = args.where.id;
    const d = args.data;
    const setClauses = [];
    const values = [id];
    let i = 2;

    for (const [key, value] of Object.entries(d)) {
      if (key === 'tags') {
        setClauses.push(`"${key}" = $${i++}`);
        values.push(value || []);
      } else if (typeof value !== 'object') {
        setClauses.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }

    const sql = `UPDATE "EnvironmentalReport" SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`;
    const res = await this._runQuery(sql, values);
    return res.rows[0];
  }

  async _deleteReport(args) {
    const id = args.where.id;
    const res = await this._runQuery('DELETE FROM "EnvironmentalReport" WHERE id = $1 RETURNING *', [id]);
    return res.rows[0] || null;
  }

  async _countReports(args = {}) {
    let sql = 'SELECT COUNT(*) FROM "EnvironmentalReport"';
    const params = [];
    const whereClauses = [];
    let i = 1;

    if (args.where) {
      const w = args.where;
      if (w.reportType) {
        whereClauses.push(`"reportType" = $${i++}`);
        params.push(w.reportType);
      }
      if (w.severity) {
        whereClauses.push(`severity = $${i++}`);
        params.push(w.severity);
      }
      if (w.status) {
        whereClauses.push(`status = $${i++}`);
        params.push(w.status);
      }
    }

    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }

    const res = await this._runQuery(sql, params);
    return parseInt(res.rows[0].count);
  }

  // --- AI ANALYSIS OPERATIONS ---
  async _createAIAnalysis(args) {
    const d = args.data;
    const fields = [];
    const placeholders = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(d)) {
      fields.push(`"${key}"`);
      placeholders.push(`$${i++}`);
      values.push(value);
    }

    const sql = `INSERT INTO "AIAnalysis" (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const res = await this._runQuery(sql, values);
    return res.rows[0];
  }

  async _findUniqueAIAnalysis(args) {
    const reportId = args.where.reportId;
    const res = await this._runQuery('SELECT * FROM "AIAnalysis" WHERE "reportId" = $1 LIMIT 1', [reportId]);
    return res.rows[0] || null;
  }

  // --- COMMENTS OPERATIONS ---
  async _createComment(args) {
    const d = args.data;
    const fields = [];
    const placeholders = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(d)) {
      fields.push(`"${key}"`);
      placeholders.push(`$${i++}`);
      values.push(value);
    }

    const sql = `INSERT INTO "Comment" (${fields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
    const res = await this._runQuery(sql, values);
    return res.rows[0];
  }

  async _findManyComments(args = {}) {
    const reportId = args.where.reportId;
    const res = await this._runQuery('SELECT c.*, u.name as "userName", u.role as "userRole" FROM "Comment" c JOIN "User" u ON c."userId" = u.id WHERE c."reportId" = $1 ORDER BY c."createdAt" ASC', [reportId]);
    return res.rows;
  }

  // --- QUESTIONNAIRE OPERATIONS ---
  async _createQuestionnaire(args) {
    const d = args.data;
    const sql = 'INSERT INTO "Questionnaire" (id, "userId", answers, score, "riskLevel", assessment, recommendations) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *';
    const res = await this._runQuery(sql, [
      d.id || require('crypto').randomUUID(),
      d.userId,
      typeof d.answers === 'string' ? d.answers : JSON.stringify(d.answers),
      d.score || 0,
      d.riskLevel || 'low',
      d.assessment,
      typeof d.recommendations === 'string' ? d.recommendations : JSON.stringify(d.recommendations)
    ]);
    return res.rows[0];
  }

  async _findManyQuestionnaires(args = {}) {
    const userId = args.where.userId;
    const res = await this._runQuery('SELECT * FROM "Questionnaire" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [userId]);
    return res.rows.map(q => {
      try {
        q.answers = JSON.parse(q.answers);
      } catch (e) {}
      try {
        q.recommendations = JSON.parse(q.recommendations);
      } catch (e) {}
      return q;
    });
  }

  // --- TIDAL DATA OPERATIONS ---
  async _createTidalData(args) {
    const d = args.data;
    const sql = 'INSERT INTO "TidalData" (id, "stationId", "stationName", "waterLevel", "tideLevel", timestamp) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
    const res = await this._runQuery(sql, [
      d.id || require('crypto').randomUUID(),
      d.stationId,
      d.stationName,
      d.waterLevel,
      d.tideLevel ?? null,
      d.timestamp ? new Date(d.timestamp) : new Date()
    ]);
    return res.rows[0];
  }

  async _findManyTidalData(args = {}) {
    let sql = 'SELECT * FROM "TidalData"';
    const params = [];
    if (args.where && args.where.stationId) {
      sql += ' WHERE "stationId" = $1';
      params.push(args.where.stationId);
    }
    sql += ' ORDER BY timestamp DESC';
    if (args.take) {
      sql += ` LIMIT ${parseInt(args.take)}`;
    }
    const res = await this._runQuery(sql, params);
    return res.rows;
  }

  // --- ENVIRONMENTAL METRIC OPERATIONS ---
  async _createEnvironmentalMetric(args) {
    const d = args.data;
    const sql = 'INSERT INTO "EnvironmentalMetric" (id, "locationId", "waterTemp", salinity, chlorophyll, turbidity, "pH", "dissolvedOxygen", "windSpeed", "waveHeight", timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *';
    const res = await this._runQuery(sql, [
      d.id || require('crypto').randomUUID(),
      d.locationId || null,
      d.waterTemp ?? null,
      d.salinity ?? null,
      d.chlorophyll ?? null,
      d.turbidity ?? null,
      d.pH ?? null,
      d.dissolvedOxygen ?? null,
      d.windSpeed ?? null,
      d.waveHeight ?? null,
      d.timestamp ? new Date(d.timestamp) : new Date()
    ]);
    return res.rows[0];
  }

  async _findManyEnvironmentalMetrics(args = {}) {
    let sql = 'SELECT * FROM "EnvironmentalMetric"';
    sql += ' ORDER BY timestamp DESC';
    if (args.take) {
      sql += ` LIMIT ${parseInt(args.take)}`;
    }
    const res = await this._runQuery(sql);
    return res.rows;
  }
}

const prisma = new PrismaEmulator();

module.exports = {
  connectDB,
  prisma,
};
