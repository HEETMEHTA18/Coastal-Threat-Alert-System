const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
const prisma = new PrismaClient();
const root = path.join(__dirname, '..', '..');
const cachePath = path.join(root, 'backend', 'uploads', 'reports.json');

function toReportLocation(report) {
  if (report.location && typeof report.location === 'object') {
    const { latitude, longitude } = report.location;
    if (latitude !== undefined && longitude !== undefined) {
      return `${latitude},${longitude}`;
    }
  }
  if (typeof report.location === 'string') return report.location;
  return 'unspecified';
}

async function main() {
  try {
    if (!fs.existsSync(cachePath)) {
      console.log('No local report cache found at', cachePath);
      return;
    }

    const reports = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    console.log(`Found ${reports.length} local cached reports.`);

    for (const report of reports) {
      const reportId = report.reportId || `CACHE_${report.id || Date.now()}`;
      const data = {
        reportId,
        reportType: report.reportType || 'environmental',
        severity: String(report.severity || 'medium').toLowerCase(),
        status: 'active',
        title: report.title || 'Untitled report',
        description: report.description || '',
        location: toReportLocation(report),
        latitude: typeof report.location === 'object' ? Number(report.location.latitude || 0) : 0,
        longitude: typeof report.location === 'object' ? Number(report.location.longitude || 0) : 0,
        contactName: report.reporter || 'anonymous',
        contactPhone: report.phone || '',
        contactEmail: report.email || null,
        contactOrganization: report.organization || null,
        source: 'community',
        visibility: 'public'
      };

      const existing = await prisma.environmentalReport.findUnique({ where: { reportId } });
      if (existing) {
        await prisma.environmentalReport.update({ where: { reportId }, data });
        console.log('Updated', reportId, data.title);
      } else {
        await prisma.environmentalReport.create({ data });
        console.log('Inserted', reportId, data.title);
      }
    }
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
