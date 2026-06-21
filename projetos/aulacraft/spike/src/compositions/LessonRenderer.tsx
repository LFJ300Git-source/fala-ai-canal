// src/compositions/LessonRenderer.tsx
//
// Driver dinâmico do Aulacraft. Lê um Storyboard e renderiza cada cena
// com o template correspondente, encadeadas via <Series>.
//
// Este componente NÃO conhece os internos dos templates — só conhece o
// schema. Adicionar novos tipos de cena = adicionar caso ao switch +
// adicionar variante à discriminated union no schema.

import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from 'remotion';
import type { Storyboard, StoryboardScene } from '../storyboard-schema';

import { AIOpenerScene } from './AIOpenerScene';
import { StockHeroScene } from './StockHeroScene';
import { TypeImpactScene } from './TypeImpactScene';
import { StockOverlayScene } from './StockOverlayScene';
import { TypeQuoteScene } from './TypeQuoteScene';
import { AICloserScene } from './AICloserScene';

const TAIL_FRAMES = 60; // 2s @ 30fps — tail no final com fade-out simultâneo
const FADE_FRAMES = 45; // Duração do fade-out (vídeo + áudio)

export type LessonRendererProps = {
  storyboard: Storyboard;
};

const renderScene = (scene: StoryboardScene): React.ReactNode => {
  switch (scene.type) {
    case 'AIOpenerScene':
      return <AIOpenerScene {...scene.props} />;
    case 'StockHeroScene':
      return <StockHeroScene {...scene.props} clipDurationInSeconds={(scene as any).clipDurationInSeconds} />;
    case 'TypeImpactScene':
      return <TypeImpactScene {...scene.props} />;
    case 'StockOverlayScene':
      return <StockOverlayScene {...scene.props} clipDurationInSeconds={(scene as any).clipDurationInSeconds} />;
    case 'TypeQuoteScene':
      return <TypeQuoteScene {...scene.props} />;
    case 'AICloserScene':
      return <AICloserScene {...scene.props} />;
    default: {
      // Exhaustiveness check: se um novo type for adicionado ao schema
      // sem case correspondente aqui, TypeScript reclama em build.
      const _exhaustive: never = scene;
      return null;
    }
  }
};

export const LessonRenderer: React.FC<LessonRendererProps> = ({ storyboard }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const fadeStart = durationInFrames - FADE_FRAMES;

  return (
    <AbsoluteFill>
      {storyboard.audioUrl && (
        <Audio
          src={staticFile(storyboard.audioUrl)}
          volume={(f) =>
            interpolate(f, [fadeStart, durationInFrames], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          }
        />
      )}
      <Series>
        {storyboard.scenes.map((scene, index) => (
          <Series.Sequence
            key={index}
            durationInFrames={
              index === storyboard.scenes.length - 1
                ? scene.durationInFrames + TAIL_FRAMES
                : scene.durationInFrames
            }
          >
            {renderScene(scene)}
          </Series.Sequence>
        ))}
      </Series>

      <AbsoluteFill
        style={{
          backgroundColor: 'black',
          opacity: interpolate(
            frame,
            [fadeStart, durationInFrames],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          ),
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
