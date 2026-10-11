import { Composition, registerRoot } from 'remotion';
import { Demo, FPS, totalFrames } from './Demo';
import { Thumbnail } from './Thumbnail';

const Root = () => (
  <>
    <Composition
      id="Demo"
      component={Demo}
      durationInFrames={totalFrames}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Composition
      id="Thumbnail"
      component={Thumbnail}
      durationInFrames={1}
      fps={FPS}
      width={1280}
      height={720}
    />
  </>
);

registerRoot(Root);
