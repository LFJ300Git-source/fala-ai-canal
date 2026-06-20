// src/compositions/MasterShowreel.tsx
// Composição mestre que encadeia as 6 cenas aprovadas numa sequência narrativa.
// Usada pra avaliar o produto como vídeo, não como prints estáticos.

import React from 'react';
import { Series } from 'remotion';
import { AIOpenerScene } from './AIOpenerScene';
import { StockHeroScene } from './StockHeroScene';
import { TypeImpactScene } from './TypeImpactScene';
import { StockOverlayScene } from './StockOverlayScene';
import { TypeQuoteScene } from './TypeQuoteScene';
import { AICloserScene } from './AICloserScene';

export const MasterShowreel: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={240}>
        <AIOpenerScene
          backgroundSrc="test-opener-bg.png"
          eyebrow="AULA 01"
          title="A DECISÃO INVISÍVEL"
          subtitle="Por que toda escolha financeira começa antes de você abrir o app do banco."
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={180}>
        <StockHeroScene
          videoSrc="test-stock-30fps.mp4"
          caption="Toda decisão financeira começa com uma escolha invisível."
          showBranding={true}
          gradeIntensity={1}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={180}>
        <TypeImpactScene
          preLine="PARTE 01"
          number="01"
          numberLabel="PRINCÍPIO"
          words={[
            { text: 'A maioria', emphasis: 'normal' },
            { text: 'fracassa', emphasis: 'display-huge' },
            { text: 'porque', emphasis: 'normal' },
            { text: 'não', emphasis: 'normal' },
            { text: 'decide', emphasis: 'editorial-italic' },
          ]}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={210}>
        <StockOverlayScene
          videoSrc="test-stock-30fps.mp4"
          eyebrow="O QUE NINGUÉM TE CONTA"
          impact="VOCÊ JÁ DECIDIU"
          gradeIntensity={1}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={210}>
        <TypeQuoteScene
          quote="O preço é o que você paga. O valor é o que você recebe."
          author="Warren Buffett"
          authorTitle="Investidor, Berkshire Hathaway"
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={270}>
        <AICloserScene
          backgroundSrc="test-opener-bg.png"
          eyebrow="AULA 01 — FIM"
          title="A escolha é sua."
          ctaLabel="PRÓXIMA AULA"
          ctaText="A ARMADILHA DOS RICOS"
          brandName="AULACRAFT"
        />
      </Series.Sequence>
    </Series>
  );
};
