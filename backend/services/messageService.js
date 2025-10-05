export function generateMessage(spatialResult, mode = "focus") {
  if (!spatialResult) return "Scanning surroundings.";

  const { spatial, centerBlocked, leftBlocked, rightBlocked } = spatialResult;

  // No obstacles = clear path
  if (spatial.length === 0)
    return mode === "calm" ? "All clear. You're safe." : "Path ahead is clear.";

  // Dead end
  if (centerBlocked && leftBlocked && rightBlocked)
    return "Dead end ahead. Turn around.";

  // Construct messages for each direction
  const leftObjs = spatial.filter(o => o.direction === "left").map(o => o.label);
  const centerObjs = spatial.filter(o => o.direction === "center").map(o => o.label);
  const rightObjs = spatial.filter(o => o.direction === "right").map(o => o.label);

  const msgs = [];
  if (centerObjs.length) msgs.push(`${centerObjs.join(", ")} ahead`);
  if (leftObjs.length) msgs.push(`${leftObjs.join(", ")} on your left`);
  if (rightObjs.length) msgs.push(`${rightObjs.join(", ")} on your right`);

  const sentence = msgs.join(". ");

  // Simplify based on mode
  if (mode === "focus") return sentence + ".";
  if (mode === "calm") return centerBlocked ? "Obstacle ahead." : "Path clear.";

  return sentence + ".";
}
