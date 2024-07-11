import { createRoot } from 'react-dom/client';
import { setAssetPath } from '@esri/calcite-components/dist/components';
setAssetPath('https://unpkg.com/@esri/calcite-components/dist/calcite/assets');
import './main.css';
import App from './components/App';

const root = createRoot(document.getElementById('root') as HTMLElement);

root.render(<App></App>);
