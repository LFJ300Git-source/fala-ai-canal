import './theme/fonts';
import React from 'react';
import { Composition } from 'remotion';
import { StockHeroScene } from './compositions/StockHeroScene';
import { TypeImpactScene } from './compositions/TypeImpactScene';
import { AIOpenerScene } from './compositions/AIOpenerScene';
import { TypeQuoteScene } from './compositions/TypeQuoteScene';
import { StockOverlayScene } from './compositions/StockOverlayScene';
import { AICloserScene } from './compositions/AICloserScene';
import { LessonRenderer } from './compositions/LessonRenderer';
import storyboardDemo from './storyboard-demo.json';
import type { Storyboard } from './storyboard-schema';

const FPS = 30;
const OUTRO_SECONDS = 1.0;
const TAIL_FRAMES = 60; // 2s @ 30fps — tail no final do vídeo com fade-out

const EMPTY_STORYBOARD = {
  totalDurationSeconds: 60,
  scenes: [] as any[],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="StockHeroScene"
        component={StockHeroScene}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={180}
        defaultProps={{
          videoSrc: 'test-stock.mp4',
          caption: 'Toda decisão financeira começa com uma escolha invisível.',
          showBranding: true,
          gradeIntensity: 1,
        }}
      />
      <Composition
        id="TypeImpactScene"
        component={TypeImpactScene as any}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={180}
        defaultProps={{
          preLine: 'PARTE 01',
          number: '01',
          numberLabel: 'PRINCÍPIO',
          words: [
            { text: 'A maioria', emphasis: 'normal' },
            { text: 'fracassa', emphasis: 'display-huge' },
            { text: 'porque', emphasis: 'normal' },
            { text: 'não', emphasis: 'normal' },
            { text: 'decide', emphasis: 'editorial-italic' },
          ],
        }}
      />
      <Composition
        id="AIOpenerScene"
        component={AIOpenerScene as any}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={240}
        defaultProps={{
          backgroundSrc: 'test-opener-bg.png',
          eyebrow: 'AULA 01',
          title: 'A DECISÃO INVISÍVEL',
          subtitle:
            'Por que toda escolha financeira começa antes de você abrir o app do banco.',
        }}
      />
      <Composition
        id="TypeQuoteScene"
        component={TypeQuoteScene as any}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={210}
        defaultProps={{
          quote: 'O preço é o que você paga. O valor é o que você recebe.',
          author: 'Warren Buffett',
          authorTitle: 'Investidor, Berkshire Hathaway',
        }}
      />
      <Composition
        id="StockOverlayScene"
        component={StockOverlayScene as any}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={210}
        defaultProps={{
          videoSrc: 'test-stock.mp4',
          eyebrow: 'O QUE NINGUÉM TE CONTA',
          impact: 'VOCÊ JÁ DECIDIU',
          gradeIntensity: 1,
        }}
      />
      <Composition
        id="AICloserScene"
        component={AICloserScene as any}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={270}
        defaultProps={{
          backgroundSrc: 'test-opener-bg.png',
          eyebrow: 'AULA 01 — FIM',
          title: 'A escolha é sua.',
          ctaLabel: 'PRÓXIMA AULA',
          ctaText: 'A ARMADILHA DOS RICOS',
          brandName: 'AULACRAFT',
        }}
      />
      <Composition
        id="LessonRenderer"
        component={LessonRenderer}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{ storyboard: storyboardDemo as Storyboard }}
        calculateMetadata={({ props }) => {
          const dur = props.storyboard?.totalDurationInFrames ?? 2430;
          return {
            durationInFrames: Math.max(1, dur + TAIL_FRAMES),
            props,
          };
        }}
      />
    </>
  );
};
