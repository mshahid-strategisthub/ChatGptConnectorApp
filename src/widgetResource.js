import fs from 'fs';

export const AURA_CHAT_WIDGET_URI = 'ui://widget/aurie-quick-processing.html';
export const AURA_CHAT_WIDGET_ASSET_BASE_TOKEN = '__AURA_CHAT_WIDGET_ASSET_BASE__';

export function loadWidgetTemplate(widgetTemplatePath) {
  return fs.readFileSync(widgetTemplatePath, 'utf8');
}

export function renderWidgetHtml(templateHtml, baseUrl) {
  return templateHtml.replaceAll(
    AURA_CHAT_WIDGET_ASSET_BASE_TOKEN,
    `${baseUrl}/assets`
  );
}


