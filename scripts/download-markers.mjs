import https from 'https';
import fs from 'fs';
import path from 'path';

const MARKER_FILES = [
  {
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon.png',
    filename: 'marker-icon.png'
  },
  {
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x.png',
    filename: 'marker-icon-2x.png'
  },
  {
    url: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-shadow.png',
    filename: 'marker-shadow.png'
  }
];

const downloadFile = (url, filename) => {
  const filepath = path.join(process.cwd(), 'public', filename);
  const file = fs.createWriteStream(filepath);

  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Downloaded ${filename}`);
    });
  }).on('error', (err) => {
    fs.unlink(filepath);
    console.error(`Error downloading ${filename}:`, err.message);
  });
};

MARKER_FILES.forEach(({ url, filename }) => {
  downloadFile(url, filename);
}); 