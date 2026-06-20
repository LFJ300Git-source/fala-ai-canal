import 'dotenv/config';
import * as path from 'path';
import { generateImages } from './images';

const ASSETS_DIR = path.resolve(__dirname, '../assets');

generateImages(ASSETS_DIR)
  .then(() => console.log('Done.'))
  .catch((err) => { console.error(err); process.exit(1); });
