import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useVideoConfig,
} from 'remotion';
import {
  CanvaAnnotatedHeartScene,
  CanvaClosingScene,
  CanvaFlowDiagramScene,
  CanvaHeroHeartScene,
  CanvaSceneWipe,
  CanvaStatScene,
  CanvaTitleScene,
} from './canva_v7';

type AnatomyPart =
  | 'whole' | 'right-atrium' | 'left-atrium' | 'right-ventricle'
  | 'left-ventricle' | 'aorta' | 'lungs';

type SceneTemplate = 'title-card' | 'hero-3d' | 'annotated-3d' | 'flow-diagram' | 'stat-card' | 'closing-card';

type StoryboardScene = {
  id: string;
  template: SceneTemplate;
  startTime: number;
  endTime: number;
  caption: string;
  accentColor: string;
  title?: string;
  subtitle?: string;
  entities?: { name: string; sublabel: string; color: string }[];
  focus?: AnatomyPart;
  highlights?: AnatomyPart[];
  annotations?: { label: string; part: AnatomyPart }[];
  flowSteps?: { label: string; color: string }[];
  statValue?: string;
  statLabel?: string;
  statSuffix?: string;
};

type Storyboard = {
  totalDurationSeconds: number;
  scenes: StoryboardScene[];
};

type Props = {
  audioUrl: string;
  storyboard: Storyboard;
};

function resolveAsset(urlOrFile: string): string {
  if (/^(https?:)?\/\//.test(urlOrFile)) return urlOrFile;
  return staticFile(urlOrFile);
}

const s = (sec: number, fps: number) => Math.round(sec * fps);

// Approximate screen positions for each anatomical part (used by annotated scene)
const ANNOTATION_POSITIONS: Record<AnatomyPart, { x: string; y: string; anchor: 'left' | 'right' }> = {
  'whole':           { x: '15%', y: '50%', anchor: 'left' },
  'right-atrium':    { x: '14%', y: '32%', anchor: 'left' },
  'left-atrium':     { x: '86%', y: '32%', anchor: 'right' },
  'right-ventricle': { x: '12%', y: '60%', anchor: 'left' },
  'left-ventricle':  { x: '88%', y: '60%', anchor: 'right' },
  'aorta':           { x: '62%', y: '18%', anchor: 'right' },
  'lungs':           { x: '8%',  y: '42%', anchor: 'left' },
};

const RenderScene: React.FC<{ scene: StoryboardScene }> = ({ scene }) => {
  switch (scene.template) {
    case 'hero-3d':
      return <CanvaHeroHeartScene caption={scene.caption} />;
    case 'annotated-3d': {
      const showLungs = scene.highlights?.includes('lungs');
      const imageSrc = showLungs ? 'heart_lungs.png' : 'heart_anatomy.png';
      const annotations = (scene.annotations ?? []).map((a) => ({
        label: a.label,
        ...ANNOTATION_POSITIONS[a.part],
      }));
      return (
        <CanvaAnnotatedHeartScene
          imageSrc={imageSrc}
          annotations={annotations}
          caption={scene.caption}
        />
      );
    }
    case 'flow-diagram':
      return <CanvaFlowDiagramScene steps={scene.flowSteps ?? []} caption={scene.caption} />;
    case 'title-card':
      return (
        <CanvaTitleScene
          title={scene.title ?? ''}
          subtitle={scene.subtitle}
          entities={scene.entities ?? []}
          caption={scene.caption}
        />
      );
    case 'stat-card':
      return (
        <CanvaStatScene
          statValue={scene.statValue ?? ''}
          statLabel={scene.statLabel ?? ''}
          statSuffix={scene.statSuffix}
          caption={scene.caption}
        />
      );
    case 'closing-card':
      return (
        <CanvaClosingScene
          title={scene.title ?? ''}
          subtitle={scene.subtitle}
          caption={scene.caption}
        />
      );
  }
};

export const LessonSummary: React.FC<Props> = ({ audioUrl, storyboard }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A1A' }}>
      <Audio src={resolveAsset(audioUrl)} />

      {storyboard.scenes.map((scene, i) => {
        const sceneFrom = s(scene.startTime, fps);
        const sceneDur = s(scene.endTime - scene.startTime, fps);
        return (
          <React.Fragment key={scene.id}>
            <Sequence from={sceneFrom} durationInFrames={sceneDur}>
              <RenderScene scene={scene} />
            </Sequence>
            {i > 0 && (
              <Sequence from={sceneFrom} durationInFrames={Math.round(0.55 * fps)}>
                <CanvaSceneWipe />
              </Sequence>
            )}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
