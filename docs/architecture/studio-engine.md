# Studio Engine — initial SSR spike
Golden Page is a 23-node fixture, validated through schema v2. Renderer v2 is additive and independent from editor state. CSS uses typed style values and token resolution; desktop base cascades to tablet (1024px) and mobile (767px). SSR returns a full HTML document with title, description, language, and CSS.
Pending: real browser visual parity, isolated viewport preview, asset resolution, image backup, editor integration and export ZIP. Local asset references render placeholders. The legacy live editor and storage remain unchanged. No deployment.
