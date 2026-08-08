export function getPubliclyVisibleFilter() {
  const now = new Date();
  return {
    $or: [
      { publishStatus: "published" },
      { publishStatus: "scheduled", scheduledFor: { $lte: now } },
    ],
  };
}
