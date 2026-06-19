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
    const tiltElements = [
      document.getElementById('hero-card'),
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

  // 7. Interactive Terminal Shell Emulator
  const terminalInput = document.getElementById('terminal-input');
  const terminalOutput = document.getElementById('terminal-output');
  const terminalBody = document.getElementById('terminal-body');
  const shortcutButtons = document.querySelectorAll('.shortcut-btn');

  const terminalCommands = {
    help: () => `Available commands:<br>
      - <span class="cmd-highlight">about</span>     : Quick bio summary<br>
      - <span class="cmd-highlight">projects</span>  : List featured code architectures<br>
      - <span class="cmd-highlight">skills</span>    : Show technical languages and frameworks<br>
      - <span class="cmd-highlight">github</span>    : Open GitHub Profile (External Link)<br>
      - <span class="cmd-highlight">linkedin</span>  : Open LinkedIn Network (External Link)<br>
      - <span class="cmd-highlight">cv</span>        : View complete CV document<br>
      - <span class="cmd-highlight">contact</span>   : Print email and contact options<br>
      - <span class="cmd-highlight">clear</span>     : Wipe terminal history`,
    about: () => `<strong>Toshal Narendra Zambare</strong><br>
      AI / Data Science & Full-Stack Developer.<br>
      CGPA: 8.7 / 10 | Savitribai Phule Pune University<br>
      Experienced in deploying automated RAG pipelines, MERN platforms, and Speech loops.`,
    projects: () => `Featured Code Projects:<br>
      - <strong>XeroxSaaS</strong> (AI platform for multi-format print streams)<br>
      - <strong>RAG Hub</strong> (Vector ingestion engine with reranking filters)<br>
      - <strong>Real-time 3D Agent</strong> (Unity & offline speech loop)<br>
      - <strong>Healthcare Optimization</strong> (Hospital resource tracking)<br>
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
      setTimeout(() => window.open('https://www.linkedin.com/in/toshal-zambare-1033282b0/', '_blank'), 500);
      return `<span class="success-msg"><i class="fa-solid fa-square-arrow-up-right"></i> Launching LinkedIn page in new tab...</span>`;
    },
    cv: () => {
      setTimeout(() => window.open('/CV.pdf', '_blank'), 500);
      return `<span class="success-msg"><i class="fa-solid fa-file-pdf"></i> Opening CV document...</span>`;
    },
    contact: () => `Connect details:<br>
      - Email: toshalzambare1@gmail.com<br>
      - Phone: +91-7666853995<br>
      - Location: Pune, Maharashtra, India`,
    clear: null
  };

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

  function handleCommand(cmdText) {
    const cleanCmd = cmdText.trim().toLowerCase();
    
    if (cleanCmd === '') return;
    
    // Print user command echo
    printLine(`guest@portfolio:~$ ${cmdText}`, 'user-cmd');
    
    if (cleanCmd === 'clear') {
      if (terminalOutput) terminalOutput.innerHTML = '';
      printLine('Terminal log wiped. Type <span class="cmd-highlight">help</span> to list commands.', 'system-msg');
      return;
    }
    
    if (cleanCmd in terminalCommands) {
      const response = terminalCommands[cleanCmd]();
      printLine(response, 'info-msg');
    } else {
      printLine(`Command not found: "${cmdText}". Type <span class="cmd-highlight">help</span> for options.`, 'error-msg');
    }
  }

  terminalInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const command = terminalInput.value;
      handleCommand(command);
      terminalInput.value = '';
    }
  });

  // Shortcut clicks with auto-typing visual simulation
  shortcutButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (!cmd || !terminalInput) return;
      
      terminalInput.value = '';
      terminalInput.focus();
      
      let index = 0;
      btn.disabled = true;
      
      const typeInterval = setInterval(() => {
        if (index < cmd.length) {
          terminalInput.value += cmd[index];
          index++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            handleCommand(cmd);
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
              <i class="${project.iconClass} project-large-icon"></i>
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
    if (e.key === 'Escape') closeModal();
  });

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
