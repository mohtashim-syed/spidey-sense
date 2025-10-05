// Divide the frame into left / center / right based on normalized x
const LEFT_ZONE = 0.33;
const RIGHT_ZONE = 0.66;

export function analyzeSpatial(detections = []) {
  const layout = { left: [], center: [], right: [] };

  // Each detection already includes { label, x, width }
  const spatial = detections.map(obj => {
    const { label, x } = obj;
    let direction = "center";
    if (x < LEFT_ZONE) direction = "left";
    else if (x > RIGHT_ZONE) direction = "right";

    layout[direction].push(label);
    return { ...obj, direction };
  });

  const centerBlocked = layout.center.length > 0;
  const leftBlocked   = layout.left.length > 0;
  const rightBlocked  = layout.right.length > 0;

  return { layout, spatial, centerBlocked, leftBlocked, rightBlocked };
}
