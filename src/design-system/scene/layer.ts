import type { CSSProperties } from "react";

/**
 * What every scene layer accepts from its page: a name for the CSS or timeline that addresses it, extra
 * classes (position and size) and extra inline style (the boot's `--d`). Each layer's own props extend this.
 */
export interface SceneLayerProps {
  "data-part"?: string;
  className?: string;
  /** Merged over the layer's own custom properties. */
  style?: CSSProperties;
}

/** A radial glow layer: where its centre sits (x, y), how far it reaches (w, h) and how strong it is. */
export interface GlowLayerProps extends SceneLayerProps {
  x?: string;
  y?: string;
  w?: string;
  h?: string;
  alpha?: number;
}
