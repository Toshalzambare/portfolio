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
    "Full-Stack Developer",
    "ML Engineer",
    "DevOps Engineer"
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
      - <span class="cmd-highlight">about</span>      : Quick bio summary<br>
      - <span class="cmd-highlight">projects</span>   : List featured code architectures<br>
      - <span class="cmd-highlight">skills</span>     : Show technical languages and frameworks<br>
      - <span class="cmd-highlight">github</span>     : Open GitHub Profile (External Link)<br>
      - <span class="cmd-highlight">linkedin</span>   : Open LinkedIn Network (External Link)<br>
      - <span class="cmd-highlight">resume</span>     : View complete Resume document<br>
      - <span class="cmd-highlight">contact</span>    : Print email and contact options<br>
      - <span class="cmd-highlight">fs</span> / <span class="cmd-highlight">fullscreen</span> : Toggle fullscreen mode<br>
      - <span class="cmd-highlight">clear</span>      : Wipe terminal history`,
    about: () => `<strong>Toshal Narendra Zambare</strong><br>
      AI / Data Science & Full-Stack Developer.<br>
      CGPA: 8.7 / 10 | Savitribai Phule Pune University<br>
      Experienced in deploying automated RAG pipelines, MERN platforms, and Speech loops.`,
    projects: () => `Featured Code Projects:<br>
      - <strong>XeroxSaaS</strong> (AI platform for multi-format print streams)<br>
      - <strong>RAG Hub</strong> (Vector ingestion engine with reranking filters)<br>
      - <strong>Real-time 3D Agent</strong> (Unity & offline speech loop)<br>
      - <strong>Healthcare Optimization</strong> (Hospital resource tracking)<br>
      - <strong>Brick Breaker Game</strong> (OpenGL C++)<br>
      Type <span class="cmd-highlight">projects</span> or click shortcuts to see more.`,
    skills: () => `Technical Skill Overview:<br>
      - AI/ML   : LLMs, LangChain, RAG, Qdrant, PyTorch, OpenCV<br>
      - Backend : FastAPI, Node.js, Celery, Redis, MongoDB<br>
      - Frontend: React.js, Flutter, HTML/CSS, JS/TS<br>
      - Systems : Docker, AWS, Firebase, Google Cloud, Git`,
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
      - Location: Nashik, Maharashtra, India`,
    clear: null
  };

  const adminCommandsHelp = () => `Admin commands:<br>
    - <span class="cmd-highlight">y</span>          : Enter Resume Management mode (Add/Delete resumes)<br>
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
      category: 'web-software',
      title: 'XeroxSaaS — AI Document Printing',
      tagline: 'Full-stack MERN SaaS platform with AI-based PDF page analysis and real-time tracking.',
      year: '2026',
      iconClass: 'fa-solid fa-print',
      tech: ['React.js', 'Node.js', 'LangChain', 'MongoDB', 'Socket.io', 'Backblaze B2'],
      details: {
        description: 'XeroxSaaS is an advanced document printing and print-management platform designed to automate printing shop logistics and document prep work. Developed during my internship at AI Leela, Nashik, it bridges full-stack MERN capabilities with LangChain AI agents. The main bottleneck for print shop owners is manual file auditing (counting color vs. grayscale pages, checking bindings, checking dimensions, sorting pages). XeroxSaaS solves this by using Python-based document processing libraries wrapped in LangChain agents that extract structural metadata, calculate exact print costs, standardise page sizes, and check alignment errors. The system communicates real-time order lifecycle events via WebSocket channels and stores uploads on Backblaze B2 cloud storage.',
        features: [
          'Full-stack architecture featuring structured JWT authentication and secure document routing.',
          'Integrated LangChain automation to standardize formatting, dimensions, and pages across inputs.',
          'Configured Socket.io connections for live order tracking notification feeds.',
          'Linked Backblaze B2 storage layers to handle multi-gigabyte media streams.',
          'Live project URL: https://anti-print.vercel.app/'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: 'https://anti-print.vercel.app/'
      }
    },
    {
      id: 'rag-hub',
      category: 'ai-ml',
      title: 'Conversational RAG Knowledge Hub',
      tagline: 'Scalable multi-modal retrieval engine featuring dense vector databases and reranking layers.',
      year: '2025',
      iconClass: 'fa-solid fa-brain',
      tech: ['FastAPI', 'Qdrant', 'PostgreSQL', 'Celery', 'Docker Compose'],
      details: {
        description: 'This is a high-throughput Retrieval-Augmented Generation (RAG) platform built for complex semantic queries across large collections of unstructured corporate data. The core challenge in enterprise search is fetching context-accurate snippets across multi-format documents (PDFs, media files, CSVs) without exceeding model context lengths or retrieving irrelevant noisy content. This system addresses this by implementing an async ingestion line with FastAPI and Celery worker threads, chunking files, converting images/videos into searchable formats, and generating dense embeddings stored inside a Qdrant vector database. Contextual reranking is performed via sentence-transformers (cross-encoders) to select only the top relevant chunks, resulting in highly precise, context-bounded citations.',
        features: [
          'Implemented parallel media processing queues using FastAPI, Celery, and Redis brokers.',
          'Integrated Qdrant vector database for hybrid semantic-dense search alongside PostgreSQL for structured metadata.',
          'Incorporated sentence-transformer models to rank and filter retrieved sections.',
          'Introduced Focus Mode UI, allowing users to restrict conversations to selected documents.',
          'Fully containerised environment structured with Docker Compose.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'agent-3d',
      category: 'ai-ml',
      title: 'Real-Time 3D Conversational AI Agent',
      tagline: 'Immersive virtual assistant supporting local Speech-to-Text and Gemini Decision loops.',
      year: '2025',
      iconClass: 'fa-solid fa-vr-cardboard',
      tech: ['Unity', 'C#', 'Gemini API', 'Flask', 'Vosk (STT)', 'pyttsx3 (TTS)'],
      details: {
        description: 'An interactive 3D virtual environment demonstrating real-time conversational loops, speech routing, and animation triggering. Developed using Unity and C# for the visual environment, it connects a user\'s speech input directly to large language model reasoning. The system is designed to run either in fully cloud-integrated mode (routing prompts to Google\'s Gemini API) or in a secure, completely offline local environment. Local speech-to-text is handled using a lightweight Vosk model, and text-to-speech outputs use custom local synthesis engines. Sentiment analysis is computed from the LLM responses to dynamically trigger matching avatar gestures and expression triggers in Unity.',
        features: [
          'Designed interactive 3D virtual environment using Unity and C# scripts.',
          'Integrated Google Gemini API for complex contextual conversations and intent translation.',
          'Created Python/Flask backend bridge to route speech commands.',
          'Used Vosk for offline Speech-to-Text (STT) and pyttsx3 for custom Text-to-Speech (TTS) outputs.',
          'Supports interactive agent gestures mapped directly to sentiment outputs from LLM responses.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'healthcare-platform',
      category: 'web-software',
      title: 'Healthcare Optimization Platform',
      tagline: 'Cross-platform app tracking bed occupancy, queues, and clinical admission records.',
      year: '2024',
      iconClass: 'fa-solid fa-hospital',
      tech: ['React Native', 'Node.js', 'AI Predictions', 'FHIR / HL7 Standards'],
      details: {
        description: 'A hospital management and resource optimization platform designed to resolve bottlenecks in regional clinic admissions, emergency room queues, and bed allocation charts. Using cross-platform technologies (React Native) for patient-facing access and robust backend algorithms, the system estimates ER wait times based on historical queue patterns, tracks real-time bed occupancy, and schedules routine rounds. It adheres to strict HL7 and FHIR medical transmission standards, enabling secure, interoperable data exchange between hospital systems.',
        features: [
          'Constructed robust cross-platform interfaces to coordinate patient registration and priority queues.',
          'Used AI-driven regression algorithms for wait-time predictions and resource requirements.',
          'Integrated FHIR/HL7 messaging schemas to support standard clinical record formats.',
          'Configured automatic hosting deployments on secure, scalable cloud nodes.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'brick-breaker',
      category: 'iot-games',
      title: 'Brick Breaker Game (OpenGL)',
      tagline: 'Retro C++ arcade game written from scratch utilizing OpenGL rendering pipelines.',
      year: '2024',
      iconClass: 'fa-solid fa-gamepad',
      tech: ['C++', 'OpenGL', 'GLUT Libraries', 'Physics Loops'],
      details: {
        description: 'A detailed reconstruction of arcade mechanics demonstrating structured object-oriented programming, custom rendering loops, and vector math. Wrote fully customized elastic collision math handling paddle angles, side-walls, and brick destructions. Rendered textures, scores, and particles using classic OpenGL / GLUT methods. Implemented object-oriented logic modules dividing board layouts, paddle controls, ball dynamics, and UI screens.',
        features: [
          'Wrote fully customized elastic collision math handling paddle angles, side-walls, and brick destructions.',
          'Rendered textures, scores, and particles using classic OpenGL / GLUT methods.',
          'Implemented object-oriented logic modules dividing board layouts, paddle controls, ball dynamics, and UI screens.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'home-automation',
      category: 'iot-games',
      title: 'ESP8266 IoT Home Automation',
      tagline: 'Bidirectional smart home controllers utilizing MQTT feeds and cloud dashboard panels.',
      year: '2024',
      iconClass: 'fa-solid fa-house-laptop',
      tech: ['ESP8266 Board', 'Arduino IoT', 'MQTT Protocol', 'Relay Circuits'],
      details: {
        description: 'A home automation system connecting consumer home appliances directly to secure remote dashboards. The core architecture uses ESP8266 microchips communicating state payloads over low-bandwidth MQTT queues. By implementing light-weight state-tracking logic and safe relay circuits, the system allows secure remote controls, automated timer configurations, and energy usage logs without adding lag or network overhead.',
        features: [
          'Programmed microcontrollers to handle appliance states using ESP8266 WiFi modules.',
          'Wrote MQTT data channels for low-latency web sockets communicating device states in real-time.',
          'Created responsive visual dashboards using Arduino IoT Cloud panels.',
          'Constructed safety-compliant physical relay circuits driving LED bulbs and fan regulators.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'hand-sign-recognition',
      category: 'ai-ml',
      title: 'Hand Sign CNN Recognizer',
      tagline: 'Webcam-driven computer vision system classifying gesture signals in real-time.',
      year: '2024',
      iconClass: 'fa-solid fa-hand',
      tech: ['Python', 'TensorFlow', 'Keras', 'OpenCV'],
      details: {
        description: 'A computer vision framework that leverages custom convolutional neural networks (CNNs) to translate hand sign vocabulary into text characters. Trained using TensorFlow and Keras, the pipeline isolates moving hand shapes in real-time camera frames using OpenCV, pre-processes the contours to standardize bounds, and feeds the cropped matrix to the model, rendering instant character predictions with high confidence scores.',
        features: [
          'Structured and trained custom Convolutional Neural Networks (CNNs) using TensorFlow and Keras.',
          'Incorporated OpenCV pipelines to isolate hands, compute thresholds, and feed frames to inferences.',
          'Applied image augmentation (rotations, flips, zoom scaling) to bolster dataset generalization.'
        ],
        link: 'https://github.com/Toshalzambare',
        liveUrl: null
      }
    },
    {
      id: 'digit-recognition',
      category: 'ai-ml',
      title: 'Handwritten Digit Web App',
      tagline: 'Neural network model classifying MNIST figures on an interactive canvas page.',
      year: '2024',
      iconClass: 'fa-solid fa-signature',
      tech: ['TensorFlow', 'Keras', 'OpenCV', 'Gradio UI'],
      details: {
        description: 'An interactive canvas editor built for real-time digit recognition. Users draw numbers on a digital canvas grid, and a custom neural network trained on the MNIST database processes the canvas pixels to yield prediction percentages. The frontend interface uses Gradio to provide clean, accessible sketching controls, while the backend processes standard image grids using OpenCV.',
        features: [
          'Trained neural network models on MNIST databases reaching 98.7% test set accuracy.',
          'Built an interactive Gradio UI interface to accept sketches directly.',
          'Configured active real-time image preprocessing to isolate canvas glyph bounds before query forwarding.'
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
      { opacity: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out', overwrite: 'auto' }
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
      
      modalBody.innerHTML = `
        <h3 class="modal-project-title">${project.title}</h3>
        <span class="modal-project-year">${project.year} | Featured Stack</span>
        <p class="modal-project-desc">${project.details.description}</p>
        
        <h4 class="modal-section-title">Key Implementations</h4>
        <ul class="modal-features-list">
          ${project.details.features.map(f => `<li>${f}</li>`).join('')}
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
