require('dotenv').config();
const mongoose = require('mongoose');
const CommunityReport = require('../src/models/CommunityReport');

async function checkReports() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get all reports
    const reports = await CommunityReport.find();
    console.log('Total reports in DB:', reports.length);
    
    if (reports.length > 0) {
      console.log('Reports found:');
      reports.forEach((report, index) => {
        console.log(`${index + 1}. ${report.title} - ${report.reportType} - ${report.status} - ${report.createdAt}`);
      });
    } else {
      console.log('No reports found in database');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking reports:', error);
    process.exit(1);
  }
}

checkReports();