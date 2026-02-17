import path from 'path';
import { fileURLToPath } from 'url';

export function getServerPaths() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const serverRoot = path.join(__dirname, '..');

  return {
    serverRoot,
    widgetTemplatePath: path.join(serverRoot, 'widget', 'aurie-quick-processing-react.html'),
    widgetsDistPath: path.join(serverRoot, 'assets'),
  };
}


