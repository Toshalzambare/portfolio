import './style.css';
import { initThreeBg } from './three-scene.js';
import { gsap } from 'gsap';

// Initialize Three.js Background Scene
window.addEventListener('DOMContentLoaded', () => {
  initThreeBg();
  initApp();
});

function initApp() {
  // 1. Loader & Entrance Animation
  gsap.from('.navbar', { y: -100, opacity: 0, duration: 1, ease: 'power4.out' });
  gsap.from('.hero-content > *', {
    y: 50,
    opacity: 0,
    stagger: 0.15,
    duration: 1,
    ease: 'power3.out'
  });
  gsap.from('.hero-visual', {
    scale: 0.8,
    opacity: 0,
    duration: 1.2,
    ease: 'back.out(1.2)',
    delay: 0.3
  });

  // 2. Typewriter Effect
  const words = [
    "AI & Data Science Engineer",
    "Full-Stack SaaS Developer",
    "Cloud & DevOps Engineer",
    "GDG Campus Cloud Lead",
    "Deep Learning & RAG Architect"
  ];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typewriterSpan = document.getElementById('typewriter-text');
  
  function type() {
    if (!typewriterSpan) return;
    const currentWord = words[wordIndex];
    
    if (isDeleting) {
      typewriterSpan.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typewriterSpan.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
    }
    
    let typingSpeed = isDeleting ? 40 : 80;
    
    if (!isDeleting && charIndex === currentWord.length) {
      typingSpeed = 2000;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typingSpeed = 500;
    }
    
    setTimeout(type, typingSpeed);
  }
  
  setTimeout(type, 1000);

  // 3. Navbar scroll effect
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar?.classList.add('scrolled');
    } else {
      navbar?.classList.remove('scrolled');
    }
  });

  // 4. Mobile navigation hamburger toggle
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }

  // 5. 3D Card Tilt Effect Function
  function applyTiltEffect() {
    // Avoid card tilt sticking on touch screens
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const tiltElements = [
      ...document.querySelectorAll('.project-card'),
      ...document.querySelectorAll('.stat-card'),
      ...document.querySelectorAll('.skills-category-card')
    ].filter(Boolean);

    tiltElements.forEach(card => {
      // Remove any existing listeners first to prevent duplicates
      card.removeEventListener('mousemove', handleTilt);
      card.removeEventListener('mouseleave', resetTilt);
      
      card.addEventListener('mousemove', handleTilt);
      card.addEventListener('mouseleave', resetTilt);
    });
  }

  function handleTilt(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((centerY - y) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  function resetTilt(e) {
    e.currentTarget.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
  }

  // Initial tilt trigger
  applyTiltEffect();

  // 6. Magnetic Pull Button Effect
  function applyMagneticEffect() {
    const magnets = document.querySelectorAll('.magnetic');
    magnets.forEach(magnet => {
      magnet.removeEventListener('mousemove', handleMagnetMove);
      magnet.removeEventListener('mouseleave', handleMagnetLeave);
      
      magnet.addEventListener('mousemove', handleMagnetMove);
      magnet.addEventListener('mouseleave', handleMagnetLeave);
    });
  }

  function handleMagnetMove(e) {
    const magnet = e.currentTarget;
    const rect = magnet.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    magnet.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
  }

  function handleMagnetLeave(e) {
    e.currentTarget.style.transform = 'translate(0px, 0px)';
  }

  // Initial magnetic trigger
  applyMagneticEffect();

  // 7. Interactive Terminal Shell Emulator (Secure Admin Mode Integrated)
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalBody = document.getElementById('terminal-body');
  const shortcutButtons = document.querySelectorAll('.shortcut-btn');
  const terminalPromptLabel = document.getElementById('terminal-prompt-label');
  const fileInput = document.getElementById('terminal-file-input');
  const terminalResumeInput = document.getElementById('terminal-resume-input');
  const terminalFullscreenBtn = document.getElementById('terminal-fullscreen-btn');
  const heroCard = document.getElementById('hero-card');
  const terminalFullscreenOverlay = document.getElementById('terminal-fullscreen-overlay');

  // Preview Modal Elements
  const adminPreviewModal = document.getElementById('admin-preview-modal');
  const adminPreviewClose = document.getElementById('admin-preview-close');
  const adminPreviewIframe = document.getElementById('admin-preview-iframe');
  const adminPreviewOverlay = adminPreviewModal?.querySelector('.modal-overlay');

  // Admin GUI File Manager Modal Elements
  const adminGuiModal = document.getElementById('admin-gui-modal');
  const adminGuiClose = document.getElementById('admin-gui-close');
  const adminGuiOverlay = adminGuiModal?.querySelector('.modal-overlay');
  const adminGuiSelectionView = document.getElementById('admin-gui-selection-view');
  const adminGuiPreviewView = document.getElementById('admin-gui-preview-view');
  const adminGuiGrid = document.getElementById('admin-gui-grid');
  const adminGuiIframe = document.getElementById('admin-gui-iframe');
  const adminGuiBackBtn = document.getElementById('admin-gui-back-btn');
  const adminGuiPreviewTitle = document.getElementById('admin-gui-preview-title');
  const adminGuiDownloadBtn = document.getElementById('admin-gui-download-btn');

  let cliMode = 'GUEST'; // 'GUEST', 'PASSWORD_PROMPT', 'ADMIN', 'RESUME_MGMT'
  let isTerminalFullscreen = false;
  let heroCardOriginalParent = heroCard?.parentElement;

  function toggleTerminalFullscreen() {
    if (!heroCard || !terminalFullscreenOverlay) return;

    if (!isTerminalFullscreen) {
      // Save original parent reference and move card into the overlay
      heroCardOriginalParent = heroCard.parentElement;
      terminalFullscreenOverlay.appendChild(heroCard);
      terminalFullscreenOverlay.classList.add('active');
      isTerminalFullscreen = true;
    } else {
      // Move card back to original parent
      if (heroCardOriginalParent) {
        heroCardOriginalParent.appendChild(heroCard);
      }
      terminalFullscreenOverlay.classList.remove('active');
      isTerminalFullscreen = false;
    }

    // Update button icon
    if (terminalFullscreenBtn) {
      const icon = terminalFullscreenBtn.querySelector('i');
      if (icon) {
        icon.className = isTerminalFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
      }
    }

    document.body.style.overflow = isTerminalFullscreen ? 'hidden' : '';

    // Scroll terminal to bottom and auto-focus input
    if (terminalBody) {
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
    if (terminalInput) {
      terminalInput.focus();
    }
  }

  terminalFullscreenBtn?.addEventListener('click', toggleTerminalFullscreen);

  const terminalCommands = {
    help: () => `Available commands:<br>
      - <span class="cmd-highlight">about</span>      : Quick bio summary & academics<br>
      - <span class="cmd-highlight">projects</span>   : List featured code architectures<br>
      - <span class="cmd-highlight">skills</span>     : Show technical languages and frameworks<br>
      - <span class="cmd-highlight">awards</span>     : View hackathon victories & leadership<br>
      - <span class="cmd-highlight">github</span>     : Open GitHub Profile (External Link)<br>
      - <span class="cmd-highlight">linkedin</span>   : Open LinkedIn Network (External Link)<br>
      - <span class="cmd-highlight">resume</span> / <span class="cmd-highlight">cv</span> : View complete Resumes & CV<br>
      - <span class="cmd-highlight">contact</span>    : Print email, phone, and contact options<br>
      - <span class="cmd-highlight">fs</span> / <span class="cmd-highlight">fullscreen</span> : Toggle fullscreen mode<br>
      - <span class="cmd-highlight">clear</span>      : Wipe terminal history`,
    about: () => `<strong>Toshal Narendra Zambare</strong><br>
      AI & Data Science Engineer | Cloud Lead @ GDG on Campus MET.<br>
      B.E. in AI & Data Science (SPPU — MET IOE) — <strong>CGPA: 8.7 / 10.0</strong><br>
      Experienced in shipping production SaaS (XeroxSaaS), RAG pipelines (Knowledge Hub), autonomous LLM agents (Alert Fatigue Triage Engine), and containerized cloud-native architectures.`,
    projects: () => `Featured Systems & Architectures:<br>
      <span class="cmd-highlight">[Full-Stack & SDE]</span><br>
      - <strong>XeroxSaaS</strong> (Production Document Processing SaaS with WebSockets)<br>
      - <strong>Scribble</strong> (Containerized Real-Time Multiplayer Canvas Game)<br>
      - <strong>Docview</strong> (React Native Viewer + Custom Android Native Module)<br>
      <span class="cmd-highlight">[AI/ML & Data Science]</span><br>
      - <strong>Alert Fatigue Triage Engine</strong> (1st Place Winner — GDG Cricketthon Hackathon 2026)<br>
      - <strong>Knowledge Hub & RAG Engine</strong> (Two-Stage Qdrant & Celery Pipeline)<br>
      - <strong>NEAT Flappy Bird</strong> (Autonomous Neuroevolution Reinforcement Agent)<br>
      <span class="cmd-highlight">[Cloud & DevOps]</span><br>
      - <strong>AWS Student Kill Switch</strong> (Serverless FinOps via Lambda/SQS/SNS)<br>
      Type <span class="cmd-highlight">projects</span> or use filters on the page to view details.`,
    skills: () => `Technical Skills Overview:<br>
      - <strong>AI & Data Science</strong>: PyTorch, TensorFlow, LangChain, RAG, Qdrant, Transformers, OpenCV, MediaPipe, NEAT<br>
      - <strong>Backend & APIs</strong>    : Node.js, FastAPI, Flask, Celery, Redis, PostgreSQL, MongoDB Atlas, WebSockets, SSE<br>
      - <strong>Frontend & Mobile</strong> : React.js, React Native, Redux, Expo, Three.js, Vite, WebGL<br>
      - <strong>DevOps & Cloud</strong>    : Docker, Compose, AWS (Lambda, SQS, SNS, EC2), GCP Cloud Build, Nginx, CI/CD<br>
      - <strong>Languages</strong>         : Python, C++, C, JavaScript (ES6+), TypeScript, Java, Dart, C#, SQL, PHP`,
    awards: () => `Achievements & Leadership:<br>
      - <strong style="color: var(--accent-gold);">1st Place Winner</strong>: Cricketthon Hackathon, GDG Nashik (Aug 2026)<br>
      - <strong>Cloud Lead</strong>: Google Developer Groups (GDG) on Campus at MET (2024–25)<br>
      - <strong>3rd Place</strong>: HackFusion Hackathon (2025)<br>
      - <strong>Flutter Co-Lead</strong>: GDG on Campus Flutter Wing (2024–25)<br>
      - <strong>Open Source</strong>: Hacktoberfest 2024 Contributor`,
    github: () => {
      setTimeout(() => window.open('https://github.com/Toshalzambare', '_blank'), 500);
      return `<span class="success-msg"><i class="fa-solid fa-square-arrow-up-right"></i> Launching GitHub profile in new tab...</span>`;
    },
    linkedin: () => {
      setTimeout(() => window.open('https://www.linkedin.com/in/toshal-zambare/', '_blank'), 500);
      return `<span class="success-msg"><i class="fa-solid fa-square-arrow-up-right"></i> Launching LinkedIn page in new tab...</span>`;
    },
    resume: () => {
      setTimeout(() => {
        if (resumeBtn) resumeBtn.click();
      }, 500);
      return `<span class="success-msg"><i class="fa-solid fa-window-restore"></i> Opening resume selection modal...</span>`;
    },
    cv: () => {
      setTimeout(() => {
        if (resumeBtn) resumeBtn.click();
      }, 500);
      return `<span class="success-msg"><i class="fa-solid fa-window-restore"></i> Opening resume selection modal...</span>`;
    },
    fs: () => {
      setTimeout(toggleTerminalFullscreen, 200);
      return `<span class="success-msg"><i class="fa-solid fa-expand"></i> Toggling terminal expansion...</span>`;
    },
    fullscreen: () => {
      setTimeout(toggleTerminalFullscreen, 200);
      return `<span class="success-msg"><i class="fa-solid fa-expand"></i> Toggling terminal expansion...</span>`;
    },
    contact: () => `Connect details:<br>
      - Email: toshalzambare1@gmail.com<br>
      - Phone: +91-7666853995<br>
      - Location: Nashik, Maharashtra, India<br>
      - Website: https://toshal.space`,
    clear: null
  };

  const adminCommandsHelp = () => `Admin commands:<br>
    - <span class="cmd-highlight">y</span>          : Enter Resume Management mode (Add/Delete resumes)<br>
    - <span class="cmd-highlight">gui</span>        : Open visual File Manager (browse, preview, download)<br>
    - <span class="cmd-highlight">up</span>         : Securely upload private file<br>
    - <span class="cmd-highlight">ls</span>         : List private files with sequential indices<br>
    - <span class="cmd-highlight">vw &lt;idx&gt;</span>     : Securely preview file in app (e.g. vw 1)<br>
    - <span class="cmd-highlight">dl &lt;idx&gt;</span>     : Securely download file (e.g. dl 1)<br>
    - <span class="cmd-highlight">del &lt;idx&gt;</span>    : Delete private file (e.g. del 1)<br>
    - <span class="cmd-highlight">da / delall</span> : Delete ALL stored private files<br>
    - <span class="cmd-highlight">fs / fullscreen</span> : Toggle fullscreen mode<br>
    - <span class="cmd-highlight">ex</span>         : Exit admin session and log out<br>
    - <span class="cmd-highlight">clear</span>      : Wipe terminal history`;

  const resumeMgmtHelp = () => `Resume Management Commands:<br>
    - <span class="cmd-highlight">up</span>         : Upload new resume (.pdf)<br>
    - <span class="cmd-highlight">ls</span>         : List current resumes<br>
    - <span class="cmd-highlight">del &lt;idx&gt;</span>    : Delete a resume (e.g. del 1)<br>
    - <span class="cmd-highlight">ex</span>         : Exit resume management mode (Back to Admin)<br>
    - <span class="cmd-highlight">fs / fullscreen</span> : Toggle fullscreen mode<br>
    - <span class="cmd-highlight">clear</span>      : Wipe terminal history`;

  function printLine(text, className = 'system-msg') {
    if (!terminalOutput) return;
    const line = document.createElement('p');
    line.className = `terminal-line ${className}`;
    line.innerHTML = text;
    terminalOutput.appendChild(line);
    
    // Auto Scroll
    if (terminalBody) {
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  }

  // Ensure that refreshing the page always logs out and resets to Guest Mode
  async function clearSessionOnLoad() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch (err) {
      // Fail silently
    }
  }
  clearSessionOnLoad();

  // Close Admin Preview Modal Function
  function closeAdminPreviewModal() {
    if (adminPreviewModal) {
      adminPreviewModal.classList.remove('active');
      if (adminPreviewIframe) adminPreviewIframe.src = 'about:blank';
      document.body.style.overflow = '';
    }
  }

  adminPreviewClose?.addEventListener('click', closeAdminPreviewModal);
  adminPreviewOverlay?.addEventListener('click', closeAdminPreviewModal);

  // ====================================================================
  // Admin GUI File Manager Modal Logic
  // ====================================================================
  function getFileIcon(filename) {
    const ext = (filename || '').split('.').pop().toLowerCase();
    const iconMap = {
      pdf: { icon: 'fa-solid fa-file-pdf', color: '#e74c3c' },
      doc: { icon: 'fa-solid fa-file-word', color: '#2b579a' },
      docx: { icon: 'fa-solid fa-file-word', color: '#2b579a' },
      xls: { icon: 'fa-solid fa-file-excel', color: '#217346' },
      xlsx: { icon: 'fa-solid fa-file-excel', color: '#217346' },
      csv: { icon: 'fa-solid fa-file-csv', color: '#217346' },
      ppt: { icon: 'fa-solid fa-file-powerpoint', color: '#d24726' },
      pptx: { icon: 'fa-solid fa-file-powerpoint', color: '#d24726' },
      png: { icon: 'fa-solid fa-file-image', color: '#9b59b6' },
      jpg: { icon: 'fa-solid fa-file-image', color: '#9b59b6' },
      jpeg: { icon: 'fa-solid fa-file-image', color: '#9b59b6' },
      gif: { icon: 'fa-solid fa-file-image', color: '#9b59b6' },
      webp: { icon: 'fa-solid fa-file-image', color: '#9b59b6' },
      svg: { icon: 'fa-solid fa-file-image', color: '#9b59b6' },
      bmp: { icon: 'fa-solid fa-file-image', color: '#9b59b6' },
      mp4: { icon: 'fa-solid fa-file-video', color: '#e67e22' },
      mov: { icon: 'fa-solid fa-file-video', color: '#e67e22' },
      avi: { icon: 'fa-solid fa-file-video', color: '#e67e22' },
      mkv: { icon: 'fa-solid fa-file-video', color: '#e67e22' },
      mp3: { icon: 'fa-solid fa-file-audio', color: '#1abc9c' },
      wav: { icon: 'fa-solid fa-file-audio', color: '#1abc9c' },
      zip: { icon: 'fa-solid fa-file-zipper', color: '#f39c12' },
      rar: { icon: 'fa-solid fa-file-zipper', color: '#f39c12' },
      '7z': { icon: 'fa-solid fa-file-zipper', color: '#f39c12' },
      tar: { icon: 'fa-solid fa-file-zipper', color: '#f39c12' },
      gz: { icon: 'fa-solid fa-file-zipper', color: '#f39c12' },
      txt: { icon: 'fa-solid fa-file-lines', color: '#95a5a6' },
      md: { icon: 'fa-solid fa-file-lines', color: '#95a5a6' },
      json: { icon: 'fa-solid fa-file-code', color: '#3498db' },
      js: { icon: 'fa-solid fa-file-code', color: '#f7df1e' },
      py: { icon: 'fa-solid fa-file-code', color: '#3776ab' },
      html: { icon: 'fa-solid fa-file-code', color: '#e34c26' },
      css: { icon: 'fa-solid fa-file-code', color: '#264de4' },
    };
    return iconMap[ext] || { icon: 'fa-solid fa-file', color: 'var(--accent-gold)' };
  }

  function formatFileSize(bytes) {
    if (!bytes && bytes !== 0) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function loadAdminGuiFiles() {
    if (!adminGuiGrid) return;

    // Show loading
    adminGuiGrid.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-secondary); width: 100%; grid-column: 1 / -1;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: var(--accent-gold);"></i>
        <p>Decrypting file index...</p>
      </div>
    `;

    // Reset to selection view
    if (adminGuiSelectionView) adminGuiSelectionView.style.display = 'flex';
    if (adminGuiPreviewView) adminGuiPreviewView.style.display = 'none';
    if (adminGuiIframe) adminGuiIframe.src = '';

    let files = [];
    try {
      const res = await fetch('/api/admin/files');
      const data = await res.json();
      if (res.ok && data.files) {
        files = data.files;
      } else {
        throw new Error(data.error || 'Failed to fetch files');
      }
    } catch (e) {
      adminGuiGrid.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary); width: 100%; grid-column: 1 / -1;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 1rem; color: #e74c3c;"></i>
          <p>Failed to load files</p>
          <p style="font-size: 0.85em; opacity: 0.7; margin-top: 0.5rem;">${e.message}</p>
        </div>
      `;
      return;
    }

    adminGuiGrid.innerHTML = '';

    if (files.length === 0) {
      adminGuiGrid.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary); width: 100%; grid-column: 1 / -1;">
          <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--border-color-gold);"></i>
          <p>No encrypted files stored</p>
          <p style="font-size: 0.85em; opacity: 0.7; margin-top: 0.5rem;">Use the CLI <span style="color: var(--accent-gold);">up</span> command to upload files.</p>
        </div>
      `;
      return;
    }

    files.forEach(f => {
      const fileIcon = getFileIcon(f.name);
      const displayName = f.name.length > 32 ? f.name.substring(0, 29) + '...' : f.name;
      const dateStr = new Date(f.uploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const sizeStr = formatFileSize(f.size);

      const card = document.createElement('div');
      card.className = 'resume-card glass-card admin-gui-file-card';
      card.innerHTML = `
        <div class="resume-card-icon" style="border-color: ${fileIcon.color}30;">
          <i class="${fileIcon.icon}" style="color: ${fileIcon.color};"></i>
        </div>
        <div class="resume-card-info">
          <h3 title="${f.name}">${displayName}</h3>
          <span class="resume-card-meta">${sizeStr} | ${dateStr}</span>
        </div>
        <div class="resume-card-actions">
          <button class="btn btn-secondary btn-sm gui-preview-btn" data-index="${f.index}" data-name="${f.name}">Preview</button>
          <a href="/api/admin/files/${f.index}/download" class="btn btn-primary btn-sm download-btn" title="Download"><i class="fa-solid fa-download"></i></a>
        </div>
      `;

      adminGuiGrid.appendChild(card);
    });

    // Wire preview buttons
    adminGuiGrid.querySelectorAll('.gui-preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = btn.getAttribute('data-index');
        const name = btn.getAttribute('data-name');
        openAdminGuiPreview(idx, name);
      });
    });
  }

  function openAdminGuiPreview(index, name) {
    if (adminGuiSelectionView) adminGuiSelectionView.style.display = 'none';
    if (adminGuiPreviewView) adminGuiPreviewView.style.display = 'flex';
    if (adminGuiIframe) adminGuiIframe.src = `/api/admin/files/${index}/preview`;
    if (adminGuiPreviewTitle) adminGuiPreviewTitle.textContent = name;
    if (adminGuiDownloadBtn) {
      adminGuiDownloadBtn.href = `/api/admin/files/${index}/download`;
      adminGuiDownloadBtn.setAttribute('download', name);
    }
  }

  function openAdminGuiModal() {
    if (adminGuiModal) {
      adminGuiModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      loadAdminGuiFiles();
    }
  }

  function closeAdminGuiModal() {
    if (adminGuiModal) {
      adminGuiModal.classList.remove('active');
      if (adminGuiIframe) adminGuiIframe.src = '';
      document.body.style.overflow = '';
    }
  }

  adminGuiClose?.addEventListener('click', closeAdminGuiModal);
  adminGuiOverlay?.addEventListener('click', closeAdminGuiModal);
  adminGuiBackBtn?.addEventListener('click', loadAdminGuiFiles);

  // Auto-fit image previews in the iframe to prevent zoomed-in layouts
  adminPreviewIframe?.addEventListener('load', () => {
    try {
      const iframeDoc = adminPreviewIframe.contentDocument || adminPreviewIframe.contentWindow.document;
      if (iframeDoc) {
        const img = iframeDoc.querySelector('img');
        if (img) {
          iframeDoc.body.style.margin = '0';
          iframeDoc.body.style.display = 'flex';
          iframeDoc.body.style.justifyContent = 'center';
          iframeDoc.body.style.alignItems = 'center';
          iframeDoc.body.style.height = '100vh';
          iframeDoc.body.style.backgroundColor = '#0b0f19';
          
          img.style.maxWidth = '100%';
          img.style.maxHeight = '100%';
          img.style.objectFit = 'contain';
          img.style.display = 'block';
          img.style.margin = 'auto';
        }
      }
    } catch (e) {
      // Ignore cross-origin warnings
    }
  });

  // File Picker Listener (Multi-upload support)
  fileInput?.addEventListener('change', async () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const files = Array.from(fileInput.files);
    
    printLine(`Preparing to encrypt and upload ${files.length} file(s)...`, 'system-msg');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      printLine(`[${i + 1}/${files.length}] Uploading "${file.name}"...`, 'system-msg');
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();
        if (response.ok && data.success) {
          printLine(`<span class="success-msg"><i class="fa-solid fa-circle-check"></i> [${i + 1}/${files.length}] ${data.message}</span>`, 'info-msg');
        } else {
          printLine(`<span class="error-msg"><i class="fa-solid fa-circle-exclamation"></i> [${i + 1}/${files.length}] Error: ${data.error || 'Failed to upload.'}</span>`, 'error-msg');
        }
      } catch (err) {
        printLine(`<span class="error-msg"><i class="fa-solid fa-circle-exclamation"></i> [${i + 1}/${files.length}] Network transmission failure.</span>`, 'error-msg');
      }
    }
    
    fileInput.value = ''; // Clear picker
  });

  // Resume File Picker Listener
  terminalResumeInput?.addEventListener('change', async () => {
    if (!terminalResumeInput.files || terminalResumeInput.files.length === 0) return;
    const file = terminalResumeInput.files[0];
    
    printLine(`Preparing to upload resume "${file.name}"...`, 'system-msg');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/admin/resumes/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (response.ok && data.success) {
        printLine(`<span class="success-msg"><i class="fa-solid fa-circle-check"></i> ${data.message}</span>`, 'info-msg');
      } else {
        printLine(`<span class="error-msg"><i class="fa-solid fa-circle-exclamation"></i> Error: ${data.error || 'Failed to upload resume.'}</span>`, 'error-msg');
      }
    } catch (err) {
      printLine(`<span class="error-msg"><i class="fa-solid fa-circle-exclamation"></i> Network transmission failure.</span>`, 'error-msg');
    }
    
    terminalResumeInput.value = ''; // Clear picker
  });

  async function handleCommand(cmdText) {
    const rawCmd = cmdText.trim();
    const cleanCmd = rawCmd.toLowerCase();
    
    if (rawCmd === '') return;

    // 1. Confirm Delete All Mode Handling
    if (cliMode === 'CONFIRM_DELETE_ALL') {
      const confirm = cleanCmd;
      
      // Revert prompt label to admin mode
      if (terminalPromptLabel) {
        terminalPromptLabel.textContent = 'admin@portfolio:~$';
      }
      
      printLine(`Confirm delete all files? (y/n): ${rawCmd}`, 'user-cmd');
      
      if (confirm === 'y' || confirm === 'yes') {
        printLine('Initiating complete data purge...', 'system-msg');
        try {
          const res = await fetch('/api/admin/files', { method: 'DELETE' });
          const data = await res.json();
          if (res.ok) {
            printLine('<span class="success-msg"><i class="fa-solid fa-trash-can"></i> All private files deleted successfully.</span>', 'info-msg');
          } else {
            printLine(`<span class="error-msg">Purge aborted: ${data.error || 'Server error'}</span>`, 'error-msg');
          }
        } catch (err) {
          printLine('<span class="error-msg">Failed to dispatch purge payload.</span>', 'error-msg');
        }
      } else {
        printLine('Operation aborted. No files were deleted.', 'info-msg');
      }
      
      cliMode = 'ADMIN';
      return;
    }

    // 2. Password Prompt Mode Handling (Masked)
    if (cliMode === 'PASSWORD_PROMPT') {
      // Revert terminal visual state
      if (terminalInput) {
        terminalInput.type = 'text';
        terminalInput.placeholder = 'type a command...';
      }
      if (terminalPromptLabel) {
        terminalPromptLabel.textContent = 'guest@portfolio:~$';
      }
      
      printLine('Password: [HIDDEN]', 'user-cmd');
      printLine('Verifying authorization...', 'system-msg');
      
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: rawCmd })
        });
        
        let data;
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await res.json();
        }
        
        if (res.ok && data && data.success) {
          cliMode = 'ADMIN';
          if (terminalPromptLabel) {
            terminalPromptLabel.textContent = 'admin@portfolio:~$';
          }
          printLine('<span class="success-msg"><i class="fa-solid fa-unlock-keyhole"></i> Authorization Verified. Secure Admin mode initialized. Type <span class="cmd-highlight">help</span> for commands.</span>', 'info-msg');
        } else {
          cliMode = 'GUEST';
          const errMsg = data ? (data.error || 'Invalid credentials.') : `HTTP Error ${res.status}`;
          printLine(`<span class="error-msg"><i class="fa-solid fa-lock"></i> Authorization Denied: ${errMsg}</span>`, 'error-msg');
        }
      } catch (err) {
        cliMode = 'GUEST';
        printLine(`<span class="error-msg"><i class="fa-solid fa-circle-exclamation"></i> Authentication server offline or returned an error page. (${err.message})</span>`, 'error-msg');
      }
      return;
    }

    // 2. Resume Management Mode Handling
    if (cliMode === 'RESUME_MGMT') {
      printLine(`admin@portfolio:resume-mgmt$ ${rawCmd}`, 'user-cmd');
      
      if (cleanCmd === 'clear') {
        if (terminalOutput) terminalOutput.innerHTML = '';
        printLine('Terminal log wiped.', 'system-msg');
        return;
      }
      
      if (cleanCmd === 'help') {
        printLine(resumeMgmtHelp(), 'info-msg');
        return;
      }
      
      if (cleanCmd === 'ex' || cleanCmd === 'exit') {
        printLine('Exiting resume management mode...', 'system-msg');
        cliMode = 'ADMIN';
        if (terminalPromptLabel) {
          terminalPromptLabel.textContent = 'admin@portfolio:~$';
        }
        printLine('Returned to secure Admin mode. Type <span class="cmd-highlight">help</span> for commands.', 'info-msg');
        return;
      }
      
      if (cleanCmd === 'up') {
        if (terminalResumeInput) {
          printLine('Launching secure resume picker (PDF only)...', 'system-msg');
          terminalResumeInput.click();
        } else {
          printLine('<span class="error-msg">Resume upload utility failed to initiate.</span>', 'error-msg');
        }
        return;
      }
      
      if (cleanCmd === 'fs' || cleanCmd === 'fullscreen') {
        toggleTerminalFullscreen();
        return;
      }
      
      if (cleanCmd === 'ls') {
        printLine('Retrieving resumes list...', 'system-msg');
        try {
          const res = await fetch('/api/resumes');
          const data = await res.json();
          if (res.ok && data.resumes) {
            if (data.resumes.length === 0) {
              printLine('No resumes found in database storage.', 'info-msg');
            } else {
              let listHtml = '<strong>Resumes List:</strong><br>';
              data.resumes.forEach((r, idx) => {
                const dateStr = new Date(r.uploadedAt).toLocaleString();
                const sizeKb = (r.size / 1024).toFixed(1);
                listHtml += `[${idx + 1}] <span class="cmd-highlight">${r.name}</span> <span style="opacity: 0.6; font-size: 0.85em;">(${sizeKb} KB, Uploaded: ${dateStr})</span><br>`;
              });
              printLine(listHtml, 'info-msg');
            }
          } else {
            printLine(`<span class="error-msg">Failed to retrieve resumes: ${data.error || 'Server error'}</span>`, 'error-msg');
          }
        } catch (err) {
          printLine('<span class="error-msg">Failed to contact resumes API.</span>', 'error-msg');
        }
        return;
      }
      
      // Check for index-based commands: del <idx>
      const parts = cleanCmd.split(/\s+/);
      const action = parts[0];
      const indexStr = parts[1];
      const targetIdx = parseInt(indexStr, 10);
      
      if (action === 'del' || action === 'delete') {
        if (isNaN(targetIdx) || targetIdx <= 0) {
          printLine('<span class="error-msg">Syntax Error: Target resume index must be a positive integer. e.g. del 1</span>', 'error-msg');
          return;
        }
        
        printLine(`Resolving resume [${targetIdx}] for deletion...`, 'system-msg');
        try {
          const listRes = await fetch('/api/resumes');
          const listData = await listRes.json();
          if (listRes.ok && listData.resumes && targetIdx <= listData.resumes.length) {
            const resumeToDelete = listData.resumes[targetIdx - 1];
            printLine(`Sending deletion request for "${resumeToDelete.name}"...`, 'system-msg');
            
            const delRes = await fetch(`/api/admin/resumes/${encodeURIComponent(resumeToDelete.name)}`, {
              method: 'DELETE'
            });
            const delData = await delRes.json();
            if (delRes.ok) {
              printLine(`<span class="success-msg"><i class="fa-solid fa-trash-can"></i> Resume "${resumeToDelete.name}" deleted successfully.</span>`, 'info-msg');
            } else {
              printLine(`<span class="error-msg">Deletion failed: ${delData.error || 'Server error'}</span>`, 'error-msg');
            }
          } else {
            printLine(`<span class="error-msg">Index [${targetIdx}] is out of bounds or list could not be retrieved.</span>`, 'error-msg');
          }
        } catch (err) {
          printLine('<span class="error-msg">Failed to execute deletion sequence.</span>', 'error-msg');
        }
        return;
      }
      
      printLine(`Command not found in resume-mgmt mode: "${rawCmd}". Type <span class="cmd-highlight">help</span> or <span class="cmd-highlight">ex</span>.`, 'error-msg');
      return;
    }

    // 3. Admin Mode Handling
    if (cliMode === 'ADMIN') {
      printLine(`admin@portfolio:~$ ${rawCmd}`, 'user-cmd');
      
      if (cleanCmd === 'clear') {
        if (terminalOutput) terminalOutput.innerHTML = '';
        printLine('Terminal log wiped.', 'system-msg');
        return;
      }
      
      if (cleanCmd === 'help') {
        printLine(adminCommandsHelp(), 'info-msg');
        return;
      }

      if (cleanCmd === 'gui') {
        printLine('<span class="success-msg"><i class="fa-solid fa-window-restore"></i> Launching visual File Manager...</span>', 'info-msg');
        setTimeout(() => openAdminGuiModal(), 300);
        return;
      }

      if (cleanCmd === 'y') {
        cliMode = 'RESUME_MGMT';
        if (terminalPromptLabel) {
          terminalPromptLabel.textContent = 'admin@portfolio:resume-mgmt$';
        }
        printLine('<span class="info-msg">[Resume Management Mode Initialized] Type <span class="cmd-highlight">help</span> for available commands, <span class="cmd-highlight">ex</span> to return to admin mode.</span>', 'info-msg');
        return;
      }

      if (cleanCmd === 'fs' || cleanCmd === 'fullscreen') {
        toggleTerminalFullscreen();
        return;
      }
      
      if (cleanCmd === 'ex') {
        printLine('Terminating secure session...', 'system-msg');
        try {
          await fetch('/api/admin/logout', { method: 'POST' });
        } catch (err) {}
        cliMode = 'GUEST';
        if (terminalPromptLabel) {
          terminalPromptLabel.textContent = 'guest@portfolio:~$';
        }
        printLine('Logged out. Admin session terminated.', 'info-msg');
        return;
      }

      if (cleanCmd === 'up') {
        if (fileInput) {
          printLine('Launching secure file picker...', 'system-msg');
          fileInput.click();
        } else {
          printLine('<span class="error-msg">Upload utility failed to initiate.</span>', 'error-msg');
        }
        return;
      }
      
      if (cleanCmd === 'ls') {
        printLine('Retrieving file directories...', 'system-msg');
        try {
          const res = await fetch('/api/admin/files');
          const data = await res.json();
          if (res.ok && data.files) {
            if (data.files.length === 0) {
              printLine('No files stored in private cloud storage.', 'info-msg');
            } else {
              let listHtml = '<strong>Stored Encrypted Files:</strong><br>';
              data.files.forEach(f => {
                const dateStr = new Date(f.uploadedAt).toLocaleString();
                listHtml += `[${f.index}] <span class="cmd-highlight">${f.name}</span> <span style="opacity: 0.6; font-size: 0.85em;">(Uploaded: ${dateStr})</span><br>`;
              });
              printLine(listHtml, 'info-msg');
            }
          } else {
            printLine(`<span class="error-msg">Failed to retrieve files: ${data.error || 'Server error'}</span>`, 'error-msg');
          }
        } catch (err) {
          printLine('<span class="error-msg">Failed to contact retrieval API.</span>', 'error-msg');
        }
        return;
      }

      if (cleanCmd === 'da' || cleanCmd === 'delall') {
        cliMode = 'CONFIRM_DELETE_ALL';
        if (terminalPromptLabel) {
          terminalPromptLabel.textContent = 'Confirm delete all? (y/n): ';
        }
        return;
      }

      // Check for index-based commands: vw <idx>, dl <idx>, del <idx>
      const parts = cleanCmd.split(/\s+/);
      const action = parts[0];
      const indexStr = parts[1];
      const targetIdx = parseInt(indexStr, 10);
      
      if ((action === 'vw' || action === 'dl' || action === 'del')) {
        if (isNaN(targetIdx) || targetIdx <= 0) {
          printLine('<span class="error-msg">Syntax Error: Target file index must be a positive integer. e.g. vw 1</span>', 'error-msg');
          return;
        }
        
        if (action === 'vw') {
          printLine(`Opening secure stream for file [${targetIdx}]...`, 'system-msg');
          if (adminPreviewIframe && adminPreviewModal) {
            // Set source directly to the secure preview endpoint
            adminPreviewIframe.src = `/api/admin/files/${targetIdx}/preview`;
            adminPreviewModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            printLine('<span class="success-msg">Preview loaded.</span>', 'info-msg');
          }
          return;
        }
        
        if (action === 'dl') {
          printLine(`Requesting decryption sequence for file [${targetIdx}]...`, 'system-msg');
          try {
            const dlAnchor = document.createElement('a');
            dlAnchor.href = `/api/admin/files/${targetIdx}/download`;
            dlAnchor.style.display = 'none';
            document.body.appendChild(dlAnchor);
            dlAnchor.click();
            document.body.removeChild(dlAnchor);
            printLine('<span class="success-msg">Download sequence triggered successfully.</span>', 'info-msg');
          } catch (err) {
            printLine('<span class="error-msg">Download request failed to dispatch.</span>', 'error-msg');
          }
          return;
        }
        
        if (action === 'del') {
          printLine(`Requesting removal of file [${targetIdx}]...`, 'system-msg');
          try {
            const res = await fetch(`/api/admin/files/${targetIdx}`, { method: 'DELETE' });
            const data = await res.json();
            if (res.ok) {
              printLine(`<span class="success-msg"><i class="fa-solid fa-trash-can"></i> File [${targetIdx}] deleted successfully.</span>`, 'info-msg');
            } else {
              printLine(`<span class="error-msg">Deletion aborted: ${data.error || 'Server error'}</span>`, 'error-msg');
            }
          } catch (err) {
            printLine('<span class="error-msg">Failed to dispatch deletion payload.</span>', 'error-msg');
          }
          return;
        }
      }
      
      printLine(`Command not found: "${rawCmd}". Type <span class="cmd-highlight">help</span> for options.`, 'error-msg');
      return;
    }

    // 3. Guest Mode Handling
    printLine(`guest@portfolio:~$ ${rawCmd}`, 'user-cmd');
    
    if (cleanCmd === 'clear') {
      if (terminalOutput) terminalOutput.innerHTML = '';
      printLine('Terminal log wiped. Type <span class="cmd-highlight">help</span> to list commands.', 'system-msg');
      return;
    }
    
    // Secret Admin Trigger
    if (cleanCmd === 'x1') {
      cliMode = 'PASSWORD_PROMPT';
      if (terminalPromptLabel) {
        terminalPromptLabel.textContent = 'Password: ';
      }
      if (terminalInput) {
        terminalInput.value = '';
        terminalInput.type = 'password';
        terminalInput.placeholder = '';
      }
      return;
    }
    
    if (cleanCmd in terminalCommands) {
      const response = terminalCommands[cleanCmd]();
      printLine(response, 'info-msg');
    } else {
      printLine(`Command not found: "${rawCmd}". Type <span class="cmd-highlight">help</span> for options.`, 'error-msg');
    }
  }

  terminalInput?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const command = terminalInput.value;
      terminalInput.value = '';
      await handleCommand(command);
    }
  });

  // Shortcut clicks with auto-typing visual simulation
  shortcutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Do not allow shortcut typing in password prompt or admin mode
      if (cliMode !== 'GUEST') return;
      
      const cmd = btn.getAttribute('data-cmd');
      if (!cmd || !terminalInput) return;
      
      terminalInput.value = '';
      terminalInput.focus();
      
      let index = 0;
      btn.disabled = true;
      
      const typeInterval = setInterval(async () => {
        if (index < cmd.length) {
          terminalInput.value += cmd[index];
          index++;
        } else {
          clearInterval(typeInterval);
          setTimeout(async () => {
            await handleCommand(cmd);
            terminalInput.value = '';
            btn.disabled = false;
          }, 200);
        }
      }, 50);
    });
  });

  // 8. Projects Registry and Dynamic Filters
  const projectsData = [
    {
      id: 'xerox-saas',
      category: 'fullstack-sde',
      title: 'XeroxSaaS — AI Document Processing SaaS',
      tagline: 'Production full-stack SaaS with automated PDF normalization, smart page counting & real-time analytics.',
      year: '2026',
      iconClass: 'fa-solid fa-file-invoice',
      badge: 'Production Live',
      tech: ['React.js', 'Node.js', 'Express.js', 'MongoDB Atlas', 'Socket.io', 'Backblaze B2', 'Docker'],
      details: {
        description: 'Engineered and shipped XeroxSaaS — a production full-stack SaaS platform featuring multi-format document uploads, automated PDF normalization, and smart page counting with automatic color detection. Built real-time order tracking, dynamic status notifications, and shop dashboard analytics using Socket.io WebSockets. Integrated cloud object storage (Backblaze B2) with automated file cleanup pipelines. Deployed live in active production use.',
        features: [
          'Full-stack SaaS with multi-format document uploads and automated normalization.',
          'Smart page counting engine with automated color & duplex detection.',
          'Real-time order tracking, dynamic status notifications, and shop analytics via Socket.io.',
          'Integrated Backblaze B2 object storage with automated data retention and cleanup pipelines.',
          'Containerized with Docker and deployed live in production.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: 'https://anti-print.vercel.app/'
      }
    },
    {
      id: 'alert-fatigue-triage',
      category: 'ai-ml',
      title: 'Alert Fatigue Triage Engine',
      tagline: '1st Place Winner: LLM-agent security triage system with MCP server and real-time visualization.',
      year: '2026',
      iconClass: 'fa-solid fa-shield-halved',
      badge: '🏆 1st Place Winner',
      tech: ['Python', 'FastAPI', 'React.js', 'PostgreSQL', 'Docker', 'MCP Server', 'LLM Agents'],
      details: {
        description: 'Built an intelligent security alert triage system that uses LLM-powered autonomous agents to classify, prioritize, and auto-remediate security alerts, drastically mitigating alert fatigue. Developed a React.js dashboard for real-time alert visualization and a FastAPI backend with PostgreSQL persistence. Implemented an MCP (Model Context Protocol) server to expose alert data to AI agents for autonomous decision-making. Awarded 1st Place at the GDG Nashik Cricketthon Hackathon 2026.',
        features: [
          'Awarded 1st Place at the Google Developer Groups (GDG) Nashik Cricketthon Hackathon 2026.',
          'Autonomous LLM-powered triage agents for real-time alert classification and remediation.',
          'Implemented Model Context Protocol (MCP) server enabling AI agents to query & resolve incidents.',
          'React.js visual telemetry dashboard with sub-second FastAPI backend persistence.',
          'Containerized deployment using Docker.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'rag-hub',
      category: 'ai-ml',
      title: 'Data Ingestion & RAG Platform',
      tagline: 'Enterprise data ingestion with multi-provider OAuth sync, Celery queues & Qdrant vector search.',
      year: '2025',
      iconClass: 'fa-solid fa-brain',
      badge: 'Production Used',
      tech: ['FastAPI', 'React', 'Redux', 'PostgreSQL', 'Redis', 'Celery', 'MinIO', 'Qdrant', 'Docker'],
      details: {
        description: 'Architected an enterprise-grade data ingestion platform with OAuth 2.0 integration for Google Drive and OneDrive, enabling automated multi-provider file sync. Engineered an async ingestion pipeline with horizontally scaled Celery workers processing multi-format files (PDF, DOCX, XLSX, images) with OCR extraction. Implemented a Two-Stage RAG chat interface backed by Qdrant vector database, SentenceTransformers, and Cross-Encoder reranking. Orchestrated 7+ Docker microservices via Docker Compose. Actively used in production at AI Leela.',
        features: [
          'Automated multi-provider delta sync for Google Drive and OneDrive via OAuth 2.0.',
          'High-throughput Celery worker ingestion pipeline extracting multimodal text and OCR.',
          'Two-Stage RAG search engine with Qdrant vector database and Cross-Encoder reranking.',
          'Server-Sent Events (SSE) streaming low-latency AI responses to a React/Redux frontend.',
          'Orchestrated 7+ Docker containers (backend, frontend, workers, Redis, Postgres, MinIO, Nginx).'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'scribble-game',
      category: 'fullstack-sde',
      title: 'Scribble — Multiplayer Drawing Game',
      tagline: 'Containerized real-time multiplayer drawing & guessing game broadcasting canvas events via WebSockets.',
      year: '2026',
      iconClass: 'fa-solid fa-paintbrush',
      badge: 'Multiplayer Web',
      tech: ['Node.js', 'Express.js', 'Socket.io', 'HTML5 Canvas', 'Docker', 'Docker Compose'],
      details: {
        description: 'Architected a low-latency, real-time multiplayer drawing game broadcasting canvas events to concurrent clients via WebSocket rooms. Developed room management, turn-based game state synchronization, word selection, scoring engine, and automated chat-based guess validation. Containerized client and server microservices using Docker and orchestrated multi-container deployment with Docker Compose.',
        features: [
          'Low-latency canvas drawing event broadcasting to concurrent clients in WebSocket rooms.',
          'Turn-based game state synchronization, custom word generator, and scoring engine.',
          'Automated chat guess evaluation with fuzzy matching and dynamic turn management.',
          'Microservices architecture containerized with Docker and Docker Compose.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'docview-app',
      category: 'fullstack-sde',
      title: 'Docview — Mobile Document Viewer',
      tagline: 'Cross-platform mobile document viewer with custom Android Native Intent module.',
      year: '2026',
      iconClass: 'fa-solid fa-mobile-screen',
      badge: 'Mobile App',
      tech: ['React Native', 'Expo', 'JavaScript', 'Custom Android Native Module'],
      details: {
        description: 'Developed a cross-platform mobile document viewer supporting file system navigation, search, and deep linking via custom intent handling. Built a custom Android Native Intent module (withIntentDataModule) to intercept system file-open requests and render documents with optimized memory handling.',
        features: [
          'Cross-platform file system explorer with instant search and document previews.',
          'Custom Android Native Intent module (withIntentDataModule) to handle external open-file intents.',
          'Deep linking and high-performance memory-optimized document rendering.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'portfolio-3d',
      category: 'fullstack-sde',
      title: 'Interactive 3D Portfolio & Admin Shell',
      tagline: 'WebGL 3D particle scene, interactive terminal emulator, and AES-256 encrypted admin storage.',
      year: '2026',
      iconClass: 'fa-solid fa-cube',
      badge: 'Live Site',
      tech: ['JavaScript', 'Three.js', 'Vite', 'Node.js', 'Express.js', 'Vercel'],
      details: {
        description: 'Built an interactive portfolio website featuring WebGL-powered 3D particle scenes, animated particle fields, and smooth scroll-driven transitions. Implemented a functional terminal emulator with custom commands, an encrypted file manager with JWT authentication, and Vercel serverless functions. Live at toshal.space.',
        features: [
          'Interactive WebGL 3D particle canvas with gravitational physics and parallax camera.',
          'Functional terminal shell emulator with custom commands, fullscreen mode, and secret admin access.',
          'Secure AES-256-GCM encrypted file storage and authenticated in-browser previewer.',
          'Modern glassmorphism interface with GSAP scroll animations.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: 'https://toshal.space'
      }
    },
    {
      id: 'neat-flappy',
      category: 'ai-ml',
      title: 'NEAT Neuroevolution AI Game',
      tagline: 'Reinforcement learning neural networks autonomously playing Flappy Bird with infinite fitness.',
      year: '2026',
      iconClass: 'fa-solid fa-network-wired',
      badge: 'AI Evolution',
      tech: ['Python', 'NEAT-Python', 'Pygame', 'Plotly'],
      details: {
        description: 'Implemented a Flappy Bird simulation with AI agents trained using the NEAT (NeuroEvolution of Augmenting Topologies) algorithm. Built a Plotly-based analytics dashboard visualizing genome fitness evolution, species diversity, and neural network topology across generations. Achieved perfect gameplay (infinite score) within 5–10 generations using feedforward neural networks with 3 inputs and 1 output.',
        features: [
          'Autonomous neuroevolution agent using NEAT genetic algorithm.',
          'Plotly analytics dashboard tracking genome fitness, species niches, and topology evolution.',
          'Achieved flawless infinite gameplay within 5–10 generations.',
          'Dual-mode real-time visualizer built in Pygame.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'aws-kill-switch',
      category: 'cloud-devops',
      title: 'AWS Student Kill Switch',
      tagline: 'Serverless FinOps cost-protection system intercepting runaway cloud resources.',
      year: '2026',
      iconClass: 'fa-brands fa-aws',
      badge: 'Cloud FinOps',
      tech: ['Python', 'AWS Lambda', 'SQS', 'SNS', 'IAM', 'CloudWatch', 'Boto3'],
      details: {
        description: 'Built a serverless AWS cost-protection system using Lambda + SQS + SNS event-driven architecture to automatically detect and terminate runaway resources. Implemented IAM least-privilege policies, CloudWatch billing alarms, and automated EC2/RDS instance shutdown workflows. Included a local Python worker fallback for environments without Lambda access.',
        features: [
          'Event-driven FinOps auto-termination pipeline via CloudWatch billing alarms and Amazon SNS.',
          'Worker queue model using Amazon SQS with Visibility Timeouts and Dead-Letter Queue (DLQ).',
          'Automated shutdown scripts terminating expensive EC2 and RDS instances on breach.',
          'Local Python worker fallback and full CLI setup/teardown guide.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'handsign-recognition',
      category: 'ai-ml',
      title: 'Real-Time ASL Handsign Recognition',
      tagline: 'Computer vision pipeline recognizing ASL letters at 30+ FPS via MediaPipe landmark extraction.',
      year: '2025',
      iconClass: 'fa-solid fa-hand',
      badge: 'Computer Vision',
      tech: ['Python', 'OpenCV', 'MediaPipe', 'TensorFlow', 'scikit-learn'],
      details: {
        description: 'Built a real-time hand sign language detection system recognizing ASL letters (A, B, C) using webcam feed. Used MediaPipe Hands for 21-point landmark extraction and trained a classification model on custom gesture datasets. Achieved real-time inference at 30+ FPS with bounding box visualization and confidence scoring.',
        features: [
          '21-point hand landmark extraction using Google MediaPipe Hands.',
          'Trained gesture classification model on custom ASL gesture datasets.',
          'Sub-30ms real-time inference (30+ FPS) with dynamic bounding boxes and confidence score overlay.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'digit-recognition',
      category: 'ai-ml',
      title: 'Handwritten Digit Recognition',
      tagline: 'Deep neural network classifier achieving 98%+ accuracy on MNIST dataset.',
      year: '2025',
      iconClass: 'fa-solid fa-calculator',
      badge: 'Deep Learning',
      tech: ['Python', 'TensorFlow', 'Keras', 'NumPy', 'Jupyter Notebook'],
      details: {
        description: 'Built and trained a deep neural network for MNIST handwritten digit classification achieving 98%+ accuracy. Implemented data preprocessing, model architecture design, training loops, and evaluation with confusion matrices.',
        features: [
          'Deep neural network reaching 98%+ test accuracy on MNIST handwritten digits.',
          'Complete pipeline with image normalization, one-hot encoding, and data augmentation.',
          'Comprehensive evaluation using confusion matrices, precision, recall, and F1-score metrics.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'agent-3d',
      category: 'ai-ml',
      title: 'AI Voice/Text NPC Game System',
      tagline: 'Unity 3D game client communicating with AI NPCs via offline STT/TTS and LLM dialogues.',
      year: '2025',
      iconClass: 'fa-solid fa-headset',
      badge: 'Game AI & LLMs',
      tech: ['Unity3D', 'C#', 'Python', 'Flask', 'WebSocket', 'LLM API'],
      details: {
        description: 'Developed a Unity game where players communicate with AI-powered NPCs via voice and text in natural language. Built a Python Flask server handling speech-to-text, LLM-based dialogue generation, and text-to-speech synthesis for immersive NPC conversations. Implemented WebSocket communication between Unity client and Python AI server for low-latency real-time interactions.',
        features: [
          'Bidirectional real-time voice and text conversations with Unity 3D NPCs.',
          'Thread-safe multiprocessing Flask backend for STT, LLM inference, and TTS generation.',
          'Low-latency WebSocket streaming for instant dialogue feedback.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'gcp-cicd',
      category: 'cloud-devops',
      title: 'Google Cloud CI/CD Pipeline',
      tagline: 'Automated continuous integration and deployment with Google Cloud Build & Cloud Run.',
      year: '2025',
      iconClass: 'fa-brands fa-google',
      badge: 'CI/CD Cloud',
      tech: ['Python', 'Google Cloud Build', 'Cloud Run', 'Docker', 'GitHub'],
      details: {
        description: 'Configured continuous integration and deployment pipelines using Google Cloud Build with automated Docker image builds and Cloud Run deployments triggered by GitHub push events.',
        features: [
          'Automated Docker image packaging triggered by GitHub push events.',
          'Serverless deployment to Google Cloud Run with secret management and traffic splitting.',
          'Automated rollbacks and health monitoring.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'snake-ladders',
      category: 'iot-games',
      title: 'Snake & Ladders (Graph BFS/DFS)',
      tagline: 'Multiplayer Pygame board game utilizing graph data structures and BFS probability solver.',
      year: '2025',
      iconClass: 'fa-solid fa-dice',
      badge: 'Graph Algorithms',
      tech: ['Python', 'Pygame', 'Graph Theory', 'BFS/DFS'],
      details: {
        description: 'Developed a multiplayer Snake & Ladders game with a graphical UI using Pygame, featuring animated dice rolls and token movement. Implemented the game board as a graph data structure and used BFS to compute optimal move sequences and win probability analysis.',
        features: [
          'Modeled board states as directed graphs with BFS/DFS optimal route computations.',
          'Win probability analysis engine and shortest-path prediction.',
          'Smooth graphical animations for dice rolls and player tokens in Pygame.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'home-automation',
      category: 'iot-games',
      title: 'IoT Home Automation System',
      tagline: 'ESP32 microcontroller system controlling appliances via relay circuits and Blynk IoT.',
      year: '2025',
      iconClass: 'fa-solid fa-house-signal',
      badge: 'IoT & Hardware',
      tech: ['Arduino', 'C++', 'ESP32 / NodeMCU', 'Relay Modules', 'Blynk IoT'],
      details: {
        description: 'Designed a smart home automation system using microcontrollers (Arduino/ESP32) controlling lights and fans via relay circuits. Implemented remote control via the Blynk IoT mobile app with Wi-Fi connectivity for real-time appliance switching.',
        features: [
          'Wi-Fi-enabled hardware control using ESP32 and Blynk IoT cloud platform.',
          'Optoisolated physical relay modules controlling high-voltage home appliances.',
          'Real-time bidirectional state telemetry and fail-safe operation.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'iot-dashboard',
      category: 'iot-games',
      title: 'IoT Environmental Monitoring',
      tagline: 'Live telemetry web dashboard monitoring environmental sensors streamed from ESP32.',
      year: '2025',
      iconClass: 'fa-solid fa-temperature-half',
      badge: 'IoT Telemetry',
      tech: ['Python', 'Flask', 'HTML/CSS/JS', 'ESP32', 'Sensors'],
      details: {
        description: 'Built a web-based dashboard for real-time environmental monitoring (temperature, humidity, air quality) with data streamed from ESP32 sensors.',
        features: [
          'Live data streaming from ESP32 edge sensor hardware.',
          'Real-time web dashboard with charts, historical trends, and alert threshold notifications.',
          'Lightweight Flask backend with RESTful telemetry endpoints.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    }
  ];

  const projectsGrid = document.getElementById('projects-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');

  function renderProjects(categoryFilter = 'all') {
    if (!projectsGrid) return;
    
    // Clear current elements
    projectsGrid.innerHTML = '';
    
    // Filter matching cards
    const filtered = projectsData.filter(p => 
      categoryFilter === 'all' || p.category === categoryFilter
    );
    
    // Build cards
    filtered.forEach(project => {
      const card = document.createElement('div');
      card.className = 'project-card-wrapper';
      card.setAttribute('data-project-id', project.id);
      
      const techTags = project.tech.map(t => `<span>${t}</span>`).join('');
      
      let badgeHtml = '';
      if (project.badge) {
        badgeHtml = `<span class="project-badge-pill ${project.badge.includes('1st') ? 'winner' : ''}">${project.badge}</span>`;
      }

      let liveDemoBtnHtml = '';
      if (project.details.liveUrl) {
        liveDemoBtnHtml = `
          <a href="${project.details.liveUrl}" target="_blank" class="live-demo-badge magnetic" onclick="event.stopPropagation();">
            Live Demo <i class="fa-solid fa-square-arrow-up-right"></i>
          </a>
        `;
      }
      
      card.innerHTML = `
        <div class="project-card glass-card">
          <div class="project-card-inner">
            <div class="project-image-placeholder">
              <div class="project-glow"></div>
              ${badgeHtml}
              <img src="/project-images/${project.id}.jpg" alt="${project.title}" class="project-image" onerror="if(this.src.endsWith('.jpg')){this.src=this.src.replace('.jpg','.png');}else if(this.src.endsWith('.png')){this.src=this.src.replace('.png','.jpeg');}else if(this.src.endsWith('.jpeg')){this.src=this.src.replace('.jpeg','.webp');}else{this.style.display='none';}">
              <i class="${project.iconClass} project-large-icon" style="position: absolute; z-index: 0;"></i>
              <span class="project-year">${project.year}</span>
            </div>
            <div class="project-info">
              <h3>${project.title}</h3>
              <p class="project-tagline">${project.tagline}</p>
              <div class="project-tech-tags">
                ${techTags}
              </div>
              <div class="project-card-actions">
                <button class="btn-card-action">View Details <i class="fa-solid fa-chevron-right"></i></button>
                ${liveDemoBtnHtml}
              </div>
            </div>
          </div>
        </div>
      `;
      
      projectsGrid.appendChild(card);
    });

    // Re-attach 3D Tilt Hover listeners
    applyTiltEffect();
    
    // Re-attach detail modal click listeners
    attachModalTriggers();
    
    // Re-attach magnetic effects for card buttons
    applyMagneticEffect();

    // Trigger entering scale/opacity GSAP animations
    gsap.fromTo('#projects-grid .project-card-wrapper', 
      { opacity: 0, scale: 0.9, y: 30 },
      { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out', overwrite: 'auto' }
    );
  }

  // Filter Button Click Listeners
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = btn.getAttribute('data-filter');
      
      // Update active style
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      renderProjects(filter);
    });
  });

  // Render all projects initially
  renderProjects('all');

  // 9. Project Modal Logic
  const modal = document.getElementById('project-modal');
  const modalClose = document.getElementById('modal-close');
  const modalBody = document.getElementById('modal-body');
  const modalOverlay = modal?.querySelector('.modal-overlay');

  function attachModalTriggers() {
    document.querySelectorAll('.project-card-wrapper').forEach(cardWrapper => {
      // Remove any existing click handlers
      cardWrapper.removeEventListener('click', openProjectModal);
      cardWrapper.addEventListener('click', openProjectModal);
    });
  }

  function openProjectModal(e) {
    const cardWrapper = e.currentTarget;
    const projectId = cardWrapper.getAttribute('data-project-id');
    const project = projectsData.find(p => p.id === projectId);
    
    if (project && modal && modalBody) {
      let linksHtml = `
        <a href="${project.details.link}" target="_blank" class="btn btn-secondary magnetic">
          <span>View Source Code</span> <i class="fa-brands fa-github"></i>
        </a>
      `;
      
      if (project.details.liveUrl) {
        linksHtml += `
          <a href="${project.details.liveUrl}" target="_blank" class="btn btn-primary magnetic">
            <span>Live Preview</span> <i class="fa-solid fa-square-arrow-up-right"></i>
          </a>
        `;
      }

      const modalTechTags = project.tech.map(t => `<span class="skill-tag">${t}</span>`).join('');
      let badgeBanner = '';
      if (project.badge) {
        badgeBanner = `<div class="modal-badge-pill ${project.badge.includes('1st') ? 'winner' : ''}">${project.badge}</div>`;
      }
      
      modalBody.innerHTML = `
        ${badgeBanner}
        <h3 class="modal-project-title">${project.title}</h3>
        <span class="modal-project-year">${project.year} | Featured Architecture</span>
        <div class="modal-tech-row" style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 1rem 0 1.25rem;">
          ${modalTechTags}
        </div>
        <p class="modal-project-desc">${project.details.description}</p>
        
        <h4 class="modal-section-title">Key Implementations & Architecture</h4>
        <ul class="modal-features-list">
          ${project.details.features.map(f => `<li><i class="fa-solid fa-angle-right" style="color: var(--accent-gold); margin-right: 0.5rem;"></i>${f}</li>`).join('')}
        </ul>
        
        <div class="modal-links-container">
          ${linksHtml}
        </div>
      `;
      
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Apply magnetic effect to dynamically loaded close/source buttons
      const modalMagnets = modal.querySelectorAll('.magnetic');
      modalMagnets.forEach(magnet => {
        magnet.addEventListener('mousemove', (e) => {
          const rect = magnet.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          magnet.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
        });
        magnet.addEventListener('mouseleave', () => {
          magnet.style.transform = 'translate(0px, 0px)';
        });
      });
    }
  }

  function closeModal() {
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  modalClose?.addEventListener('click', closeModal);
  modalOverlay?.addEventListener('click', closeModal);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close fullscreen terminal first if active
      if (isTerminalFullscreen) {
        toggleTerminalFullscreen();
        return;
      }
      closeModal();
      closeResumeModal();
      closeAdminPreviewModal();
      closeAdminGuiModal();
    }
  });

  // Click anywhere in the terminal body to focus the input
  terminalBody?.addEventListener('click', () => {
    if (terminalInput) terminalInput.focus();
  });

  // Resume Modal Logic
  const resumeModal = document.getElementById('resume-modal');
  const resumeModalClose = document.getElementById('resume-modal-close');
  const resumeBtn = document.getElementById('btn-resume-preview');
  const resumeOverlay = resumeModal?.querySelector('.modal-overlay');

  const resumeSelectionView = document.getElementById('resume-selection-view');
  const resumePreviewView = document.getElementById('resume-preview-view');
  const resumeGrid = document.getElementById('resume-grid');
  const resumeIframe = document.getElementById('resume-iframe');
  const resumeBackBtn = document.getElementById('resume-back-btn');
  const resumePreviewTitle = document.getElementById('resume-preview-title');
  const resumePreviewDownloadBtn = document.getElementById('resume-preview-download-btn');

  // Load and show resumes list
  async function loadResumesList() {
    if (!resumeGrid) return;
    
    // Show loading
    resumeGrid.innerHTML = `
      <div class="resume-loading" style="text-align: center; padding: 3rem; color: var(--text-secondary); width: 100%;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: var(--accent-gold);"></i>
        <p>Fetching available resumes...</p>
      </div>
    `;
    
    if (resumeSelectionView) resumeSelectionView.style.display = 'flex';
    if (resumePreviewView) resumePreviewView.style.display = 'none';
    if (resumeIframe) resumeIframe.src = '';
    
    let resumes = [];
    try {
      const res = await fetch('/api/resumes');
      const data = await res.json();
      if (res.ok && data.resumes) {
        resumes = data.resumes;
      } else {
        throw new Error('Failed to fetch resumes from API');
      }
    } catch (e) {
      console.warn('Failed to load resumes from API:', e);
      // Only fallback to a default if the API completely failed (e.g. local dev without backend)
      resumes = [];
    }
    
    resumeGrid.innerHTML = '';

    if (resumes.length === 0) {
      resumeGrid.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-secondary); width: 100%; grid-column: 1 / -1;">
          <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--border-color-gold);"></i>
          <p>No resumes available in database.</p>
          <p style="font-size: 0.85em; opacity: 0.7; margin-top: 0.5rem;">Use Admin CLI (manage mode) to upload resumes.</p>
        </div>
      `;
      return;
    }
    
    resumeGrid.innerHTML = '';
    resumes.forEach(r => {
      const displayName = r.name.replace(/_/g, ' ').replace(/\.pdf$/i, '');
      const sizeKb = (r.size / 1024).toFixed(0);
      const dateStr = new Date(r.uploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      
      const card = document.createElement('div');
      card.className = 'resume-card glass-card';
      card.innerHTML = `
        <div class="resume-card-icon">
          <i class="fa-solid fa-file-pdf"></i>
        </div>
        <div class="resume-card-info">
          <h3>${displayName}</h3>
          <span class="resume-card-meta">${sizeKb} KB | ${dateStr}</span>
        </div>
        <div class="resume-card-actions">
          <button class="btn btn-secondary btn-sm preview-btn" data-url="${r.url}" data-name="${displayName}">Preview</button>
          <a href="${r.url}" download="${r.name}" class="btn btn-primary btn-sm download-btn" title="Download Resume"><i class="fa-solid fa-download"></i></a>
        </div>
      `;
      
      resumeGrid.appendChild(card);
    });

    resumeGrid.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-url');
        const name = btn.getAttribute('data-name');
        openResumePreview(url, name);
      });
    });

    // Apply magnetic visual effects on card buttons
    const selectionMagnets = resumeGrid.querySelectorAll('.btn');
    selectionMagnets.forEach(magnet => {
      magnet.addEventListener('mousemove', (e) => {
        const rect = magnet.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        magnet.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
      });
      magnet.style.transition = 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)';
      magnet.addEventListener('mouseleave', () => {
        magnet.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  function openResumePreview(url, name) {
    if (resumeSelectionView) resumeSelectionView.style.display = 'none';
    if (resumePreviewView) resumePreviewView.style.display = 'flex';
    if (resumeIframe) resumeIframe.src = url;
    if (resumePreviewTitle) resumePreviewTitle.textContent = name;
    if (resumePreviewDownloadBtn) {
      resumePreviewDownloadBtn.href = url;
      resumePreviewDownloadBtn.setAttribute('download', name + '.pdf');
    }
  }

  resumeBtn?.addEventListener('click', () => {
    if (resumeModal) {
      resumeModal.classList.add('active');
      document.body.style.overflow = 'hidden';
      loadResumesList();
    }
  });

  function closeResumeModal() {
    if (resumeModal) {
      resumeModal.classList.remove('active');
      if (resumeIframe) resumeIframe.src = '';
      document.body.style.overflow = '';
    }
  }

  resumeModalClose?.addEventListener('click', closeResumeModal);
  resumeOverlay?.addEventListener('click', closeResumeModal);
  resumeBackBtn?.addEventListener('click', loadResumesList);

  // 10. Intersection Observer for Scroll Reveals
  const scrollElements = document.querySelectorAll('.section-header, .about-grid, .skills-category-card, .timeline-item, .achievement-card, .edu-card, .cert-item, .contact-card, .contact-form-container');
  
  const elementObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        gsap.to(entry.target, {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: 'power2.out',
          overwrite: 'auto'
        });
        elementObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  scrollElements.forEach(el => {
    gsap.set(el, { y: 30, opacity: 0 });
    elementObserver.observe(el);
  });

  // 11. Contact Form Handling
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (formStatus) {
      formStatus.className = 'form-status';
      formStatus.style.display = 'block';
      formStatus.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending message...';
      
      const formData = new FormData(contactForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        _honey: '', // Honey pot field to prevent bot spam
        _template: 'table'
      };

      fetch('https://formsubmit.co/ajax/toshalzambare1@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(data)
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Form submission failed');
      })
      .then(res => {
        formStatus.classList.add('success');
        formStatus.innerHTML = '<i class="fa-solid fa-check"></i> Thank you! Your message has been sent successfully.';
        contactForm.reset();
      })
      .catch(error => {
        formStatus.classList.add('error');
        formStatus.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Oops! Something went wrong. Please try again.';
        console.error('Submission error:', error);
      });
    }
  });
}
