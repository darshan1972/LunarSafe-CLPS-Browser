const fs = require('fs');
const path = require('path');

const mdPath = path.resolve('LUNARSAFE_MASTER_SPECIFICATION_AND_VERIFICATION_DOSSIER.md');
const md = fs.readFileSync(mdPath, 'utf8');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LunarSafe — Definitive Mission Master Specification & Authenticity Dossier</title>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-dark.min.css" />
  <style>
    body { background-color: #0b0f19; color: #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; }
    .banner { position: sticky; top: 0; z-index: 100; background: linear-gradient(135deg, #1e293b, #0f172a); border-bottom: 2px solid #38bdf8; padding: 16px 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); }
    .banner h1 { margin: 0; font-size: 20px; color: #38bdf8; font-family: monospace; letter-spacing: 1px; }
    .banner .meta { font-size: 13px; color: #94a3b8; margin-top: 4px; }
    .banner strong { color: #f8fafc; }
    .btn-group { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn { background: #2563eb; color: #ffffff; border: none; padding: 9px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; transition: background 0.2s; }
    .btn:hover { background: #1d4ed8; }
    .btn-secondary { background: #334155; }
    .btn-secondary:hover { background: #475569; }
    .btn-success { background: #059669; }
    .btn-success:hover { background: #047857; }
    .container { max-width: 1040px; margin: 30px auto; padding: 0 20px 80px 20px; }
    .markdown-body { background-color: #0f172a !important; color: #e2e8f0 !important; border: 1px solid #1e293b; border-radius: 12px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); font-size: 15px; line-height: 1.7; }
    .markdown-body pre { background-color: #1e293b !important; border: 1px solid #334155 !important; border-radius: 8px; }
    .markdown-body code { font-family: "JetBrains Mono", Consolas, Menlo, monospace; }
    .markdown-body table { display: table; width: 100%; margin: 20px 0; border-collapse: collapse; }
    .markdown-body th, .markdown-body td { border: 1px solid #334155 !important; padding: 10px 14px; }
    .markdown-body th { background: #1e293b; color: #38bdf8; }
    .markdown-body blockquote { border-left: 4px solid #38bdf8; color: #94a3b8; background: #1e293b44; padding: 8px 16px; border-radius: 0 8px 8px 0; }
    .markdown-body h1, .markdown-body h2, .markdown-body h3 { color: #f8fafc; border-bottom-color: #334155; }
    .markdown-body h1 { color: #38bdf8; }
    .markdown-body h2 { color: #60a5fa; margin-top: 36px; }
    @media print {
      .banner { display: none; }
      body { background: #ffffff !important; color: #000000 !important; }
      .markdown-body { background: #ffffff !important; color: #000000 !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
      .markdown-body pre { background-color: #f1f5f9 !important; border-color: #cbd5e1 !important; color: #0f172a !important; }
      .markdown-body th { background: #f1f5f9 !important; color: #0f172a !important; }
      .markdown-body th, .markdown-body td { border: 1px solid #cbd5e1 !important; }
      .markdown-body h1, .markdown-body h2, .markdown-body h3 { color: #0f172a !important; }
    }
  </style>
</head>
<body>
  <div class="banner">
    <div>
      <h1>🚀 LUNARSAFE MISSION DOSSIER</h1>
      <div class="meta">Project Head: <strong>DARSHAN BAGUL (PATIL)</strong> &nbsp;|&nbsp; Team: <strong>Team Rocket</strong> &nbsp;|&nbsp; Version: <strong>1.0.0 Production</strong></div>
    </div>
    <div class="btn-group">
      <button class="btn btn-success" onclick="window.print()">🖨️ Print / Save as PDF</button>
      <a class="btn" href="/download/dossier" download="LUNARSAFE_MASTER_SPECIFICATION_AND_VERIFICATION_DOSSIER.md">📄 Download Markdown</a>
      <a class="btn btn-secondary" href="/download/zip" download="LunarSafe_Final_Verified_Mission_Software.zip">📦 Download Full ZIP</a>
      <a class="btn btn-secondary" href="/" target="_blank">🛰️ Open Mission Terminal</a>
    </div>
  </div>
  <div class="container">
    <div id="content" class="markdown-body">Rendering document...</div>
  </div>
  <script>
    mermaid.initialize({ startOnLoad: false, theme: "dark" });
    const rawMarkdown = ${JSON.stringify(md)};
    document.getElementById("content").innerHTML = marked.parse(rawMarkdown);
    mermaid.init(undefined, document.querySelectorAll(".language-mermaid"));
  </script>
</body>
</html>`;

fs.writeFileSync('LUNARSAFE_MASTER_SPECIFICATION_AND_VERIFICATION_DOSSIER.html', html, 'utf8');
fs.writeFileSync('C:/Users/stuti/Desktop/LUNARSAFE_MASTER_SPECIFICATION_AND_VERIFICATION_DOSSIER.html', html, 'utf8');
fs.writeFileSync('C:/Users/stuti/Downloads/LUNARSAFE_MASTER_SPECIFICATION_AND_VERIFICATION_DOSSIER.html', html, 'utf8');
console.log('HTML dossier created in root, Desktop, and Downloads.');
