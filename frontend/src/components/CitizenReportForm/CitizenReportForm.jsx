import React, { useState } from 'react';

const categories = [
  'Erosion',
  'Plastic Waste',
  'Illegal Cutting',
  'Oil Spill',
  'Flooding',
  'Other',
];

const CitizenReportForm = ({ onSubmit }) => {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [location, setLocation] = useState(null);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const handleImageChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const fetchLocation = () => {
    setLoadingLoc(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingLoc(false);
        },
        () => setLoadingLoc(false)
      );
    } else {
      setLoadingLoc(false);
    }
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (!description || !category || !location) return;
    onSubmit({ image, description, category, location });
    setImage(null);
    setDescription('');
    setCategory(categories[0]);
    setLocation(null);
  };

  return (
    <form className="bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow-xl flex flex-col gap-4" onSubmit={handleSubmit}>
      <label className="font-semibold text-blue-700">Upload Photo</label>
      <input type="file" accept="image/*" onChange={handleImageChange} className="mb-2" />
      {image && <img src={image} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-2" />}
      <label className="font-semibold text-blue-700">Description</label>
      <textarea value={description} onChange={e => setDescription(e.target.value)} className="rounded-lg p-2 mb-2" rows={3} placeholder="Describe what you observed..." required />
      <label className="font-semibold text-blue-700">Category</label>
      <select value={category} onChange={e => setCategory(e.target.value)} className="rounded-lg p-2 mb-2">
        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
      </select>
      <div className="flex items-center gap-4">
        <button type="button" onClick={fetchLocation} className="bg-cyan-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-cyan-600 transition">
          {loadingLoc ? 'Fetching Location...' : 'Auto-Fetch GPS'}
        </button>
        {location && <span className="text-xs text-gray-700">Lat: {location.lat}, Lng: {location.lng}</span>}
      </div>
      <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-xl shadow-lg font-bold mt-4 hover:bg-blue-800 transition">Submit Report</button>
    </form>
  );
};

export default CitizenReportForm;
