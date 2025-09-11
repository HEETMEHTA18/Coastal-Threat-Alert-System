import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import ReportMapOverlay from './ReportMapOverlay';

const { BaseLayer, Overlay } = LayersControl;

const mangroveSites = [
  { id: 1, name: 'Zone 1', position: [19.076, 72.877], aiRisk: 0.8, communityReports: 2 },
  { id: 2, name: 'Zone 2', position: [18.520, 73.856], aiRisk: 0.3, communityReports: 5 },
];

const problemAreas = [
  { id: 1, position: [19.076, 72.877], type: 'Illegal Cutting', severity: 'High' },
  { id: 2, position: [18.520, 73.856], type: 'Flooding', severity: 'Medium' },
];

const MangroveMap = ({ reports = [] }) => (
  <div className="w-full h-96 rounded-2xl shadow-xl bg-white/20 backdrop-blur-lg">
    <MapContainer center={[19.076, 72.877]} zoom={7} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '1rem' }}>
      <LayersControl position="topright">
        <BaseLayer checked name="Satellite">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        </BaseLayer>
        <Overlay name="Mangrove Sites">
          {mangroveSites.map(site => (
            <Marker key={site.id} position={site.position}>
              <Popup>
                <strong>{site.name}</strong><br />
                AI Risk: {Math.round(site.aiRisk * 100)}%<br />
                Community Reports: {site.communityReports}
              </Popup>
            </Marker>
          ))}
        </Overlay>
        <Overlay name="Problem Areas">
          {problemAreas.map(area => (
            <Circle key={area.id} center={area.position} radius={5000} color={area.severity === 'High' ? 'red' : 'orange'}>
              <Popup>
                <strong>{area.type}</strong><br />
                Severity: {area.severity}
              </Popup>
            </Circle>
          ))}
        </Overlay>
        <Overlay name="Citizen Reports">
          <ReportMapOverlay reports={reports} />
        </Overlay>
      </LayersControl>
    </MapContainer>
  </div>
);

export default MangroveMap;
