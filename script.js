import os
# Re-write style.css and script.js since session reset
from pathlib import Path

css = """\
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;font-family:Inter,sans-serif;background:#0b0b0f;color:#f5f5f2}a{color:inherit;text-decoration:none}button{font-family:Inter,sans-serif}
.topbar{position:fixed;top:0;left:0;right:0;z-index:50;height:64px;display:flex;align-items:center;gap:16px;padding:0 20px;background:rgba(11,11,15,.94);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,.07)}
.brand{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:15px;cursor:pointer;background:none;border:none;color:#f5f5f2;padding:0}
.menu-toggle{display:none;background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:9px;cursor:pointer}
.menu-toggle span{display:block;width:17px;height:2px;background:#f5f5f2;margin:3px 0;border-radius:2px}
.progress-wrap{margin-left:auto;display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600}
.progress-track{width:140px;height:6px;background:#1b1b24;border-radius:999px;overflow:hidden}
.progress-fill{height:100%;width:0;background:linear-gradient(90deg,#c9a84c,#f0d88a);transition:width .4s ease}
.layout{display:grid;grid-template-columns:288px 1fr;padding-top:64px;min-height:100vh}
.sidebar{position:sticky;top:64px;height:calc(100vh - 64px);overflow-y:auto;padding:14px 10px;border-right:1px solid rgba(255,255,255,.07);background:#0d0d12}
.sidebar-head{display:none;align-items:center;justify-content:space-between;padding:0 4px 12px;font-weight:600;font-size:14px}
#closeSidebar{background:transparent;border:1px solid rgba(255,255,255,.1);color:#f5f5f2;border-radius:8px;padding:4px 10px;cursor:pointer;font-size:18px}
.module-nav details{background:#111118;border:1px solid rgba(255,255,255,.07);border-radius:14px;margin-bottom:8px;overflow:hidden}
.module-nav details.nav-locked{opacity:.5}
.module-nav details.nav-locked summary{cursor:not-allowed}
.module-nav summary{list-style:none;padding:12px 14px;cursor:pointer;display:grid;grid-template-columns:16px auto 1fr auto;align-items:center;gap:6px}
.module-nav summary::-webkit-details-marker{display:none}
.nav-icon{font-size:12px;color:#c9a84c;text-align:center}
.nav-mod-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#c9a84c;white-space:nowrap}
.nav-mod-name{font-family:'Space Grotesk',sans-serif;font-size:13px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav-count{font-size:11px;background:rgba(201,168,76,.1);color:#c9a84c;padding:2px 7px;border-radius:999px;text-align:right;white-space:nowrap}
.lesson-list{display:grid;padding:4px 10px 10px;gap:5px}
.lesson-link{width:100%;background:#0a0a10;border:1px solid transparent;border-radius:10px;padding:9px 10px;font-size:13px;color:#c5c5cf;display:flex;align-items:center;gap:8px;cursor:pointer;text-align:left;transition:all .15s}
.lesson-link:hover,.lesson-link.active{border-color:rgba(201,168,76,.4);background:rgba(201,168,76,.07);color:#f5f5f2}
.lesson-link.done{color:#8ee0ac}
.ll-num{font-size:11px;color:#a7a7a7;min-width:18px;font-weight:600}
.ll-title{flex:1;line-height:1.3}
.ll-check{color:#8ee0ac;font-size:12px;margin-left:auto}
.content{padding:22px 28px;max-width:960px}
#lessonView{display:none}
.hero{background:#13131a;border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:32px;margin-bottom:20px;box-shadow:0 8px 32px rgba(0,0,0,.2)}
.eyebrow,.card-label{color:#c9a84c;text-transform:uppercase;letter-spacing:.12em;font-size:11px;font-weight:700;margin-bottom:8px}
.hero h1{font-family:'Space Grotesk',sans-serif;font-size:30px;margin:8px 0 12px;line-height:1.25}
.tagline{max-width:680px;color:#b5b5bf;font-size:16px;line-height:1.7;margin-bottom:20px}
.hero-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0 24px}
.hero-grid div{background:#0f0f16;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px}
.hero-grid strong{display:block;font-family:'Space Grotesk',sans-serif;font-size:13px;margin-bottom:4px}
.hero-grid span{color:#a7a7a7;font-size:12px}
.start-course-btn{display:inline-flex;align-items:center;gap:8px;background:#c9a84c;color:#0b0b0f;border:none;border-radius:14px;padding:14px 28px;font-weight:800;font-size:16px;cursor:pointer;transition:background .15s}
.start-course-btn:hover{background:#d9b85c}
.dashboard-card{background:#13131a;border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:20px;box-shadow:0 8px 32px rgba(0,0,0,.18)}
.dashboard-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
.stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}
.stat{background:#0f0f16;border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px;text-align:center}
.stat span{display:block;font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;color:#c9a84c}
.stat small{color:#a7a7a7;font-size:12px}
.primary-btn{background:#c9a84c;color:#0b0b0f;border:none;border-radius:12px;padding:11px 18px;font-weight:700;cursor:pointer;font-size:14px;transition:background .15s}
.primary-btn:hover{background:#d9b85c}
.secondary-btn{background:#1a1a22;color:#f5f5f2;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:9px 14px;font-weight:600;cursor:pointer;font-size:13px}
.tool-list{display:grid;gap:10px;margin-top:12px}
.tool-item{background:#0f0f16;border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:13px}
.tool-item strong{display:block;font-size:14px;margin-bottom:3px}
.tool-item span{color:#a7a7a7;font-size:13px}
.featured-card{margin-bottom:16px}
.featured-card h2{font-family:'Space Grotesk',sans-serif;font-size:18px;margin:8px 0 6px}
.featured-card p{color:#b5b5bf;font-size:14px;line-height:1.6;margin:0 0 14px}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.gallery-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:12px}
.gallery-slot span{display:block;color:#a7a7a7;font-size:12px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
.placeholder{min-height:110px;background:#0a0a10;border:2px dashed rgba(255,255,255,.1);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#a7a7a7;font-size:13px}
.overview-card{margin-bottom:16px}
.overview-card h3{font-family:'Space Grotesk',sans-serif;font-size:18px;margin:8px 0 12px}
.overview-card p{color:#b5b5bf;font-size:15px;line-height:1.75;margin:0 0 10px}
.overview-card ul,.overview-card ol{color:#b5b5bf;padding-left:20px;line-height:1.9;margin:0}
.overview-card li{margin-bottom:2px}
.prompt-card{margin-bottom:16px}
.prompt-library{display:grid;gap:8px;margin-top:4px}
.pl-group{background:#0f0f16;border:1px solid rgba(255,255,255,.07);border-radius:12px;overflow:hidden}
.pl-toggle{width:100%;background:transparent;border:none;color:#f5f5f2;padding:12px 14px;text-align:left;font-size:13px;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
.pl-toggle:hover{background:rgba(255,255,255,.04)}
.pl-arrow{color:#c9a84c;font-size:11px}
.pl-body{padding:0 12px 12px}
.muted{color:#a7a7a7;font-size:14px}
.lesson-page{padding-bottom:40px}
.lesson-breadcrumb{display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:13px;color:#a7a7a7;flex-wrap:wrap}
.back-btn{background:transparent;border:1px solid rgba(255,255,255,.1);color:#f5f5f2;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px;display:flex;align-items:center;gap:6px}
.back-btn:hover{background:rgba(255,255,255,.06)}
.breadcrumb-sep{color:#555}
.breadcrumb-mod{color:#c9a84c}
.breadcrumb-lesson{color:#f5f5f2;font-weight:600}
.lesson-card-full{background:#13131a;border:1px solid rgba(255,255,255,.07);border-radius:20px;padding:28px;box-shadow:0 8px 32px rgba(0,0,0,.2)}
.lesson-card-full.done{border-color:rgba(34,102,62,.35)}
.lesson-card-header{margin-bottom:18px}
.lesson-title-main{font-family:'Space Grotesk',sans-serif;font-size:26px;font-weight:700;margin:10px 0 0;line-height:1.3}
.status-pill{display:inline-flex;align-items:center;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:#1b1b26;color:#a7a7a7}
.status-pill.done{background:rgba(34,102,62,.2);color:#8ee0ac}
.lesson-body p{color:#d2d2d9;line-height:1.8;margin:10px 0;font-size:15px}
.lesson-body ul,.lesson-body ol{color:#d2d2d9;padding-left:22px;line-height:1.85;margin:10px 0}
.lesson-body li{margin-bottom:5px}
.lesson-footer{margin-top:24px;padding-top:18px;border-top:1px solid rgba(255,255,255,.07)}
.lesson-nav-btns{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.mark-complete{background:rgba(201,168,76,.12);color:#f5f5f2;border:1px solid rgba(201,168,76,.35);padding:11px 22px;border-radius:12px;cursor:pointer;font-size:14px;font-weight:700;transition:all .15s}
.mark-complete:hover:not(:disabled){background:rgba(201,168,76,.22)}
.mark-complete.done{background:rgba(34,102,62,.2);border-color:rgba(34,102,62,.5);color:#8ee0ac}
.mark-complete:disabled{opacity:.4;cursor:not-allowed}
.nav-lesson-btn{background:#1a1a22;color:#f5f5f2;border:1px solid rgba(255,255,255,.1);border-radius:10px;padding:10px 18px;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s}
.nav-lesson-btn:hover{background:#242430}
.nav-lesson-btn.next-btn{background:#c9a84c;color:#0b0b0f;border-color:#c9a84c}
.nav-lesson-btn.next-btn:hover{background:#d9b85c}
.mod-complete-banner{margin-top:16px;background:rgba(34,102,62,.15);border:1px solid rgba(34,102,62,.3);border-radius:12px;padding:14px 18px;color:#8ee0ac;font-size:14px;font-weight:600;text-align:center}
.code-box{position:relative;background:#08080d;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;overflow-x:auto;margin:10px 0}
.code-box pre{margin:0;white-space:pre-wrap;word-break:break-word}
.code-box code{font-size:13px;color:#e2e2e8;font-family:'Courier New',monospace;line-height:1.6}
.copy-btn{position:absolute;top:10px;right:10px;background:#1a1a22;border:1px solid rgba(255,255,255,.1);color:#f5f5f2;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:11px;font-weight:600}
.copy-btn:hover{background:#242430}
.table-wrap{overflow-x:auto;margin:12px 0}
.table-wrap table{border-collapse:collapse;width:100%;font-size:14px}
.table-wrap td{padding:10px 14px;border:1px solid rgba(255,255,255,.08);color:#d2d2d9}
.table-wrap tr:first-child td{background:#111118;font-weight:600;color:#f5f5f2}
.footer{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:28px 0 16px;color:#a7a7a7;font-size:13px;border-top:1px solid rgba(255,255,255,.07);margin-top:32px}
@media(max-width:1024px){.layout{grid-template-columns:1fr}.sidebar{position:fixed;left:-300px;top:64px;width:280px;z-index:40;transition:left .25s ease}.sidebar.open{left:0}.sidebar-head{display:flex}.menu-toggle{display:block}.dashboard-grid,.hero-grid,.stats-row,.gallery-grid{grid-template-columns:1fr}.content{padding:16px 18px}.hero{padding:22px 20px}.lesson-card-full{padding:20px}}
"""

Path('style.css').write_text(css)
print('style.css:', len(css), 'bytes')
print('index.html:', Path('index.html').stat().st_size, 'bytes')
