import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const categoryColors = {
  'Erosion': 'orange',
  'Plastic Waste': 'red',
  'Illegal Cutting': 'purple',
  'Oil Spill': 'black',
  'Flooding': 'blue',
  'Other': 'gray',
};

function getIcon(category) {
  return L.divIcon({
    className: '',
    html: `<div style='background:${categoryColors[category] || 'gray'};width:24px;height:24px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px ${categoryColors[category]};display:flex;align-items:center;justify-content:center;'><span style='color:white;font-size:16px;font-weight:bold;'>*</span></div>`
  });
}

const ReportMapOverlay = ({ reports }) => (
  <>
    {reports.filter(r => r.location).map((report, idx) => (
      <Marker key={idx} position={[report.location.lat, report.location.lng]} icon={getIcon(report.category)}>
        <Popup>
          <div style={{maxWidth:'220px'}}>
            <strong>{report.category}</strong><br/>
            <span>{report.description}</span><br/>
            {report.image && <img src={report.image} alt="Report" style={{width:'100%',borderRadius:'8px',margin:'8px 0'}} />}
            <span style={{fontSize:'0.8em',color:'#555'}}>Reported: {report.createdAt ? new Date(report.createdAt).toLocaleString() : 'Now'}</span>
          </div>
        </Popup>
      </Marker>
    ))}
  </>
);

export default ReportMapOverlay;
