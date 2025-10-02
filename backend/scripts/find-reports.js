const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function findReports() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\nAll collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check each collection for documents that look like reports
    console.log('\nSearching for reports in each collection:');
    for (const col of collections) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`\n${col.name}: ${count} documents`);
      
      if (count > 0) {
        const sample = await db.collection(col.name).findOne();
        console.log('  Sample document fields:', Object.keys(sample).join(', '));
        
        // Check if this looks like a report
        if (sample.title || sample.description || sample.severity) {
          console.log('  ✓ This looks like a report collection!');
          const reports = await db.collection(col.name).find().limit(3).toArray();
          console.log('  First 3 reports:');
          reports.forEach((r, i) => {
            console.log(`    ${i + 1}. ${r.title || 'No title'} - ${r.type || r.severity || 'unknown'}`);
          });
        }
      }
    }
    
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

findReports();
