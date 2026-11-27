# Canvas drag and drop spike
Native desktop HTML drag and drop inside the opaque editing iframe. The bridge validates channel, message shape, known IDs and zones; the host checks source/origin and calls Editor Core against the latest document. Only drop mutates history. Indicators are geometric hints, not a guarantee of validity; structural/locked target checks occur on receipt. Preview stays script-free. No new dependencies.
Pending: browser E2E, cross-frame and touch dragging, horizontal grid targeting, invalid-target visual feedback, shortcuts and floating toolbar. No merge or deployment.
