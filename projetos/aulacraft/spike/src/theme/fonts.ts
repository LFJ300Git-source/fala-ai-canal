// src/theme/fonts.ts
// Bootstrap de fontes. Importado uma vez no Root pra efeito colateral.
// Não exporta nada usado em runtime — só dispara o loadFont() de cada família.

import { loadFont as loadBebasNeue } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadSpaceMono } from '@remotion/google-fonts/SpaceMono';

loadBebasNeue();
loadInter();
loadFraunces();
loadSpaceMono();
