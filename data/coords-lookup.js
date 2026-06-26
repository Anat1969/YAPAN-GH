// Optional fallback coordinates by place name (Hebrew or English).
// Used by normalize.js when a timeline item / sleep entry is missing lat+lng.
// Add entries as: "שם המקום": { lat: 00.0000, lng: 000.0000 }
window.COORDS_LOOKUP = {
  "אוסקה": { lat: 34.6937, lng: 135.5023 },
  "Osaka": { lat: 34.6937, lng: 135.5023 },
  "קיוטו": { lat: 35.0116, lng: 135.7681 },
  "Kyoto": { lat: 35.0116, lng: 135.7681 },
  "נארה": { lat: 34.6851, lng: 135.8048 },
  "Nara": { lat: 34.6851, lng: 135.8048 },
  "קובה": { lat: 34.6901, lng: 135.1955 },
  "Kobe": { lat: 34.6901, lng: 135.1955 },
  "קאנאזאווה": { lat: 36.5613, lng: 136.6562 },
  "Kanazawa": { lat: 36.5613, lng: 136.6562 }
};
