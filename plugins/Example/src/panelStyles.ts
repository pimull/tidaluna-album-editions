export const panelStyles = `
:host{all:initial;color-scheme:dark;font-family:Inter,"Segoe UI",system-ui,sans-serif}
*{box-sizing:border-box}button,summary{-webkit-tap-highlight-color:transparent}
button{font:600 13px/1.3 "Segoe UI",system-ui,sans-serif;cursor:pointer;transition:background .15s,border-color .15s}
button:focus-visible,summary:focus-visible{outline:2px solid #67e8df;outline-offset:4px}
button:disabled{cursor:default;opacity:.6}
.avb-trigger{position:fixed;right:24px;bottom:112px;z-index:99990;padding:12px 20px;border:1px solid #ffffff30;border-radius:24px;background:#1d2128;color:#f4f7fa;box-shadow:0 6px 24px #0005;letter-spacing:.02em}
.avb-trigger:hover{background:#2c333e;border-color:#ffffff60}
.avb-backdrop{position:fixed;inset:0;z-index:99998;background:#0005}
.avb-panel{position:fixed;right:20px;top:60px;bottom:100px;width:min(600px,calc(100vw - 40px));z-index:99999;overflow:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:#454b56 transparent;background:#14171c;color:#f4f6fa;border:1px solid #ffffff21;border-radius:20px;padding:24px;box-shadow:0 24px 90px #0008;font:14px/1.5 "Segoe UI",system-ui,sans-serif}
.avb-panel h2,.avb-panel h3,.avb-panel p{margin:0;font-family:inherit}
.avb-header{position:sticky;top:-24px;z-index:2;display:flex;justify-content:space-between;align-items:center;gap:16px;background:#14171c;margin:-24px -24px 20px;padding:22px 24px 18px;border-bottom:1px solid #ffffff12}
.avb-header h2{font-size:23px;font-weight:650;letter-spacing:-.5px}
.avb-close{border:1px solid #ffffff21;background:#ffffff08;color:#dce2ea;border-radius:10px;padding:8px 12px;flex-shrink:0}
.avb-close:hover,.avb-open:hover{background:#ffffff15;border-color:#ffffff55}
.avb-intro{margin-bottom:20px!important;color:#9da7b5;font-size:13px;overflow-wrap:anywhere}
.avb-note{font-size:12px;color:#8c97a8;margin:14px 0!important;line-height:1.6}
.avb-warning{padding:12px 14px;background:#e4a84010;border:1px solid #e4a84030;border-radius:10px;color:#f1c77b;margin-bottom:16px;font-size:12px}
.avb-warning summary{cursor:pointer;font-weight:600}
.avb-warning p{margin-top:8px}
.avb-card{display:grid;grid-template-columns:88px minmax(0,1fr);gap:18px;padding:20px 0;border-top:1px solid #ffffff12}
.avb-cover{width:88px;height:88px;object-fit:cover;border-radius:8px;background:linear-gradient(135deg,#30474c,#26202f);box-shadow:0 4px 14px #0004}
.avb-card h3{font-size:17px;font-weight:600;line-height:1.4;letter-spacing:-.2px;overflow-wrap:anywhere}
.avb-artist{font-size:13px;color:#bec6d2;margin-top:5px!important}
.avb-meta{font-size:12px;color:#8895a7;margin-top:6px!important;font-variant-numeric:tabular-nums}
.avb-current{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9fe8d2;margin-bottom:7px}
.avb-formats{display:flex;gap:6px;flex-wrap:wrap;margin-top:14px!important}
.avb-format{font-size:11px;font-weight:650;border:1px solid #ffffff18;background:#ffffff05;border-radius:5px;padding:3px 7px}
.avb-spec{font-size:12px;line-height:1.6;margin-top:8px!important;font-variant-numeric:tabular-nums;color:#8c97a8;overflow-wrap:anywhere}
.avb-details{font-size:11px;color:#8995a6;margin-top:12px;overflow-wrap:anywhere}
.avb-details summary{cursor:pointer;color:#9da9ba;list-style-position:inside}
.avb-details summary:hover{color:#e0e7f0}
.avb-details p{margin-top:6px}
.avb-open{margin-top:14px;padding:8px 12px;border:1px solid #ffffff28;border-radius:8px;background:#ffffff06;color:#e5ebf3}
.avb-footer{border-top:1px solid #ffffff12;padding-top:16px;margin-top:4px;color:#768294;font-size:11px;line-height:1.6}
.avb-footer p{margin-top:8px}
@media(max-width:560px){.avb-panel{right:8px;top:40px;bottom:88px;width:calc(100vw - 16px);padding:18px;border-radius:14px}.avb-header{top:-18px;margin:-18px -18px 16px;padding:17px 18px}.avb-card{grid-template-columns:64px minmax(0,1fr);gap:12px;padding:18px 0}.avb-cover{width:64px;height:64px}.avb-card h3{font-size:15px}.avb-header h2{font-size:21px}.avb-trigger{right:16px;bottom:100px}}
@media(prefers-reduced-motion:reduce){button{transition:none}}
`;
