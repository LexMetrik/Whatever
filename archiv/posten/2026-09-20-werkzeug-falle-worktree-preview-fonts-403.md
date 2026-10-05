<!-- @posten
dach: W2·18-FEHLERBUCH
titel: Werkzeug-Falle Worktree-Preview: Fonts 403
anlass: Bauer #892
-->

  - [ ] **Werkzeug-Falle Worktree-Preview: Fonts 403** *(Bauer #892)* — Vite `server.fs.allow` kennt das symlinkte `node_modules` nicht; Wurzel-Fix `fs.allow` auf `fs.realpathSync('node_modules')` in `vite.config.ts`.
