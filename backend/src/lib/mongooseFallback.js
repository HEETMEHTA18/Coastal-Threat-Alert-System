const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../../data/db_fallback');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log('🗄️ Mongoose transparent local JSON database fallback initialized.');

function getFilePath(modelName) {
  return path.join(dbDir, `${modelName.toLowerCase()}.json`);
}

function loadData(modelName) {
  const filePath = getFilePath(modelName);
  if (!fs.existsSync(filePath)) {
    try {
      fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    } catch (e) {
      console.error(`Failed to create empty file for ${modelName}:`, e);
    }
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error loading fallback data for ${modelName}:`, err);
    return [];
  }
}

function saveData(modelName, data) {
  const filePath = getFilePath(modelName);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error saving fallback data for ${modelName}:`, err);
  }
}

// Distance calculation for findNearby
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper to check match
function filterResults(data, filter) {
  if (!filter || Object.keys(filter).length === 0) {
    return data;
  }
  
  return data.filter(item => {
    for (const key in filter) {
      const val = filter[key];
      
      // Match email case insensitively
      if (key === 'email' && typeof val === 'string') {
        const itemEmail = (item.email || '').toString().toLowerCase();
        const filterEmail = val.toLowerCase();
        if (itemEmail !== filterEmail) return false;
        continue;
      }
      
      // Match ID
      if ((key === '_id' || key === 'id') && val) {
        const itemId = (item._id || item.id || '').toString();
        const filterId = val.toString();
        if (itemId !== filterId) return false;
        continue;
      }
      
      // Handle MongoDB operators: { $in: [...] }, { $gte: ... }, { $lte: ... }
      if (val && typeof val === 'object') {
        if ('$in' in val) {
          const list = val['$in'];
          const itemVal = item[key];
          if (!Array.isArray(list) || !list.includes(itemVal)) return false;
          continue;
        }
        if ('$gte' in val) {
          const limit = val['$gte'];
          const itemVal = item[key];
          if (itemVal < limit) return false;
          continue;
        }
        if ('$lte' in val) {
          const limit = val['$lte'];
          const itemVal = item[key];
          if (itemVal > limit) return false;
          continue;
        }
      }
      
      // Dot notation fallback for nested keys
      if (key.includes('.')) {
        const parts = key.split('.');
        let current = item;
        for (const part of parts) {
          current = current ? current[part] : undefined;
        }
        if (current !== val) return false;
        continue;
      }
      
      // Direct match
      if (item[key] !== val) {
        return false;
      }
    }
    return true;
  });
}

// Chainable query class mimicking Mongoose Query
class FallbackQuery {
  constructor(modelName, data, filter) {
    this.modelName = modelName;
    this.data = data;
    this.filter = filter;
    this._sort = null;
    this._limit = null;
    this._skip = 0;
  }

  select(arg) {
    return this;
  }

  populate(arg) {
    return this;
  }

  sort(arg) {
    this._sort = arg;
    return this;
  }

  limit(n) {
    this._limit = n;
    return this;
  }

  skip(n) {
    this._skip = n;
    return this;
  }

  async exec() {
    let results = filterResults(this.data, this.filter);
    
    // Simple sort implementation
    if (this._sort) {
      const sortKey = typeof this._sort === 'string' ? this._sort : Object.keys(this._sort)[0];
      const sortOrder = typeof this._sort === 'string' 
        ? (this._sort.startsWith('-') ? -1 : 1)
        : this._sort[sortKey];
      const cleanSortKey = typeof this._sort === 'string' && this._sort.startsWith('-') 
        ? this._sort.slice(1) 
        : sortKey;

      results.sort((a, b) => {
        let valA = a[cleanSortKey];
        let valB = b[cleanSortKey];
        if (valA === undefined) return 1;
        if (valB === undefined) return -1;
        if (valA < valB) return -1 * sortOrder;
        if (valA > valB) return 1 * sortOrder;
        return 0;
      });
    }
    
    if (this._skip) {
      results = results.slice(this._skip);
    }
    
    if (this._limit !== null && this._limit !== undefined) {
      results = results.slice(0, this._limit);
    }

    // Convert back into Mongoose Model instances using hydrate so isNew is false and fields are not marked as modified
    const ModelClass = mongoose.model(this.modelName);
    return results.map(item => ModelClass.hydrate(item));
  }

  then(onResolve, onReject) {
    return this.exec().then(onResolve, onReject);
  }

  catch(onReject) {
    return this.exec().catch(onReject);
  }
}

// Override Model prototype save method
const originalSave = mongoose.Model.prototype.save;
mongoose.Model.prototype.save = async function(options) {
  if (mongoose.connection.readyState === 1) {
    return originalSave.apply(this, arguments);
  }
  
  const modelName = this.constructor.modelName;
  const data = loadData(modelName);
  
  console.log(`[mongooseFallback] saving ${modelName}:`, this.toObject());

  if (!this._id) {
    this._id = new mongoose.Types.ObjectId();
  }
  
  // Custom schema pre-save hook emulation for User password hashing
  if (modelName === 'User' && this.isModified('password')) {
    const isAlreadyHashed = typeof this.password === 'string' && /^\$2[ayb]\$\d+\$[./A-Za-z0-9]{53}$/.test(this.password);
    if (!isAlreadyHashed) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Custom schema pre-save hook emulation for CommunityReport priority and tags
  if (modelName === 'CommunityReport') {
    if (!this.reportId) {
      this.reportId = `CR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    if (this.severity === 'critical' || (this.emergencyDetails && this.emergencyDetails.immediateRisk)) {
      this.priority = 10;
    } else if (this.severity === 'high' || (this.emergencyDetails && this.emergencyDetails.evacuationNeeded)) {
      this.priority = 8;
    } else if (this.severity === 'medium') {
      this.priority = 5;
    } else {
      this.priority = 3;
    }
    
    if (!this.tags || this.tags.length === 0) {
      this.tags = [this.reportType, this.severity];
      if (this.emergencyDetails && this.emergencyDetails.immediateRisk) this.tags.push('immediate_risk');
      if (this.emergencyDetails && this.emergencyDetails.evacuationNeeded) this.tags.push('evacuation');
    }
  }

  const obj = this.toObject({ virtuals: true });
  if (!obj._id) {
    obj._id = this._id;
  }
  
  const idx = data.findIndex(item => item._id.toString() === obj._id.toString());
  if (idx !== -1) {
    data[idx] = obj;
  } else {
    data.push(obj);
  }
  
  saveData(modelName, data);
  return this;
};

// Wrap mongoose model creation
const originalModel = mongoose.model;

function wrapModel(name, Model) {
  const originalFind = Model.find;
  const originalFindOne = Model.findOne;
  const originalFindById = Model.findById;
  const originalCountDocuments = Model.countDocuments;
  const originalUpdateOne = Model.updateOne;
  const originalDeleteMany = Model.deleteMany;
  const originalFindByIdAndUpdate = Model.findByIdAndUpdate;

  Model.find = function(filter) {
    if (mongoose.connection.readyState === 1) {
      return originalFind.apply(this, arguments);
    }
    const data = loadData(name);
    return new FallbackQuery(name, data, filter);
  };

  Model.findOne = function(filter) {
    if (mongoose.connection.readyState === 1) {
      return originalFindOne.apply(this, arguments);
    }
    const data = loadData(name);
    const q = new FallbackQuery(name, data, filter);
    const originalExec = q.exec;
    q.exec = async function() {
      const res = await originalExec.call(q);
      return res[0] || null;
    };
    return q;
  };

  Model.findById = function(id) {
    if (mongoose.connection.readyState === 1) {
      return originalFindById.apply(this, arguments);
    }
    const data = loadData(name);
    const results = filterResults(data, { _id: id });
    const q = new FallbackQuery(name, results, {});
    q.exec = async function() {
      return results[0] ? Model.hydrate(results[0]) : null;
    };
    return q;
  };

  Model.countDocuments = function(filter) {
    if (mongoose.connection.readyState === 1) {
      return originalCountDocuments.apply(this, arguments);
    }
    const data = loadData(name);
    const results = filterResults(data, filter);
    return Promise.resolve(results.length);
  };

  Model.findByIdAndUpdate = async function(id, update, options) {
    if (mongoose.connection.readyState === 1) {
      return originalFindByIdAndUpdate.apply(this, arguments);
    }
    const data = loadData(name);
    const idx = data.findIndex(item => (item._id || item.id || '').toString() === id.toString());
    if (idx === -1) return null;
    let docObj = data[idx];
    if (update.$set) {
      docObj = { ...docObj, ...update.$set };
    } else {
      docObj = { ...docObj, ...update };
    }
    data[idx] = docObj;
    saveData(name, data);
    return Model.hydrate(docObj);
  };

  Model.updateOne = async function(filter, update) {
    if (mongoose.connection.readyState === 1) {
      return originalUpdateOne.apply(this, arguments);
    }
    const data = loadData(name);
    const idx = data.findIndex(item => filterResults([item], filter).length > 0);
    if (idx === -1) return { n: 0, nModified: 0, ok: 1 };
    let docObj = data[idx];
    if (update.$set) {
      docObj = { ...docObj, ...update.$set };
    } else {
      docObj = { ...docObj, ...update };
    }
    data[idx] = docObj;
    saveData(name, data);
    return { n: 1, nModified: 1, ok: 1 };
  };

  Model.deleteMany = async function(filter) {
    if (mongoose.connection.readyState === 1) {
      return originalDeleteMany.apply(this, arguments);
    }
    const data = loadData(name);
    const remaining = data.filter(item => filterResults([item], filter).length === 0);
    const deletedCount = data.length - remaining.length;
    saveData(name, remaining);
    return { deletedCount };
  };

  // Add custom statics override for specific models
  if (name === 'CommunityReport') {
    const originalFindNearby = Model.findNearby;
    const originalGetStatistics = Model.getStatistics;
    const originalFindByTimeRange = Model.findByTimeRange;

    Model.findNearby = function(lat, lng, radius = 10) {
      if (mongoose.connection.readyState === 1) {
        return originalFindNearby.apply(this, arguments);
      }
      const data = loadData(name);
      const results = data.filter(item => {
        if (!item.coordinates || !item.coordinates.lat || !item.coordinates.lng) return false;
        const dist = getDistance(lat, lng, item.coordinates.lat, item.coordinates.lng);
        return dist <= radius;
      });
      return Promise.resolve(results.map(item => Model.hydrate(item)));
    };

    Model.findByTimeRange = function(startDate, endDate) {
      if (mongoose.connection.readyState === 1) {
        return originalFindByTimeRange.apply(this, arguments);
      }
      const data = loadData(name);
      const results = data.filter(item => {
        const date = new Date(item.createdAt);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
      return Promise.resolve(results.map(item => Model.hydrate(item)));
    };

    Model.getStatistics = function() {
      if (mongoose.connection.readyState === 1) {
        return originalGetStatistics.apply(this, arguments);
      }
      const data = loadData(name);
      const stats = {
        _id: null,
        totalReports: data.length,
        activeReports: data.filter(r => r.status === 'active').length,
        resolvedReports: data.filter(r => r.status === 'resolved').length,
        criticalReports: data.filter(r => r.severity === 'critical').length,
        totalSMSSent: data.reduce((sum, r) => sum + (r.smsAlerts?.sent || 0), 0),
        averageResponseTime: data.reduce((sum, r) => sum + (r.responseTime || 0), 0) / (data.length || 1)
      };
      return Promise.resolve([stats]);
    };
  }

  return Model;
}

mongoose.model = function(name, schema) {
  if (arguments.length === 1) {
    return originalModel.apply(this, arguments);
  }
  const Model = originalModel.apply(this, arguments);
  return wrapModel(name, Model);
};
