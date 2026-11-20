import { buildShapes } from './forgeShapes.js';

/** Builds the forge's shapes off the main thread and hands the buffers back without copying them. */
self.onmessage = (e) => {
  const data = buildShapes(e.data.small);
  self.postMessage(data, [...data.settled.map((a) => a.buffer), data.start.buffer]);
};
