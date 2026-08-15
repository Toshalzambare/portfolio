import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { put, del, list, get, head } from '@vercel/blob';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust Vercel's reverse proxy for correct client IP detection
const PORT = process.env.PORT || 5000;

// Initialize file uploads directory (use writable /tmp on Vercel to prevent read-only filesystem crash)
const UPLOADS_DIR = process.env.VERCEL
  ? '/tmp/private_uploads'
  : path.join(__dirname, 'private_uploads');

try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Failed to initialize local uploads directory:', err.message);
}

// Initialize public resumes directory
const RESUMES_DIR = process.env.VERCEL
  ? '/tmp/resumes'
  : path.join(__dirname, 'public', 'resumes');

try {
  if (!fs.existsSync(RESUMES_DIR)) {
    fs.mkdirSync(RESUMES_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Failed to initialize local resumes directory:', err.message);
}

// Helper: Resolve file buffer from known workspace locations
function findWorkspaceFile(relativePath) {
  const possiblePaths = [
    path.join(__dirname, relativePath),
    path.join(process.cwd(), relativePath),
    path.join(__dirname, 'dist', relativePath),
    path.join(process.cwd(), 'dist', relativePath)
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      return { path: p, buffer: fs.readFileSync(p) };
    }
  }
  return null;
}

// Copy default resumes from workspace folders if local resumes folder is empty
try {
  const localResumes = fs.existsSync(RESUMES_DIR) ? fs.readdirSync(RESUMES_DIR) : [];
  if (localResumes.filter(f => f.toLowerCase().endsWith('.pdf')).length === 0) {
    console.log('[Startup] Local resumes folder is empty. Copying defaults...');
    
    // Copy CV
    const cvFile = findWorkspaceFile('public/CV.pdf') || findWorkspaceFile('new_cv.pdf');
    if (cvFile) {
      fs.writeFileSync(path.join(RESUMES_DIR, 'Toshal_Zambare_CV.pdf'), cvFile.buffer);
    }
    
    // Copy Resume
    const resumeFile = findWorkspaceFile('public/resume.pdf');
    if (resumeFile) {
      fs.writeFileSync(path.join(RESUMES_DIR, 'Toshal_Zambare_AI_Resume.pdf'), resumeFile.buffer);
    }
    
    // Copy from new_resume directory if available
    const srcNewResumeDir = path.join(__dirname, 'new_resume');
    if (fs.existsSync(srcNewResumeDir)) {
      const defaultFiles = fs.readdirSync(srcNewResumeDir);
      for (const file of defaultFiles) {
        if (file.toLowerCase().endsWith('.pdf')) {
          fs.copyFileSync(path.join(srcNewResumeDir, file), path.join(RESUMES_DIR, file));
        }
      }
    }
    console.log('[Startup] Default resumes initialized.');
  }
} catch (err) {
  console.warn('Failed to copy default resumes on startup:', err.message);
}

// ----------------------------------------------------
// Global Middlewares & Security Headers
// ----------------------------------------------------
app.use(express.json());
app.use(cookieParser());

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// ----------------------------------------------------
// Helpers: Encryption / Decryption Engine (AES-256-GCM)
// ----------------------------------------------------
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('Invalid ENCRYPTION_KEY in environment variables. Must be a 64-character hex string.');
  }
  return Buffer.from(keyHex, 'hex');
}

// Encrypt file buffer with AES-256-GCM
function encrypt(buffer) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // GCM standard IV is 12 bytes
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes auth tag
  
  // Combine: [IV (12 bytes) | Tag (16 bytes) | Encrypted Data]
  return Buffer.concat([iv, tag, encrypted]);
}

// Decrypt file buffer with AES-256-GCM (Returns original plaintext buffer)
function decrypt(combinedBuffer) {
  const key = getEncryptionKey();
  
  if (combinedBuffer.length < 28) {
    throw new Error('File buffer is too short to contain IV and Tag.');
  }
  
  const iv = combinedBuffer.subarray(0, 12);
  const tag = combinedBuffer.subarray(12, 28);
  const encryptedData = combinedBuffer.subarray(28);
  
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

// Helper: Infer MIME type from file extension
function getMimeType(fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  const mimeMap = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.json': 'application/json',
    '.js': 'text/javascript; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.zip': 'application/zip',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.7z': 'application/x-7z-compressed',
    '.rar': 'application/vnd.rar',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.csv': 'text/csv; charset=utf-8'
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// ----------------------------------------------------
// Storage Adapters (Local Filesystem vs Vercel Blob)
// ----------------------------------------------------
const isVercelBlobEnabled = () => {
  return !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
};

// Universal Blob Put helper (supports both private and public Blob store configurations)
async function blobPut(pathname, buffer, options = {}) {
  try {
    return await put(pathname, buffer, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      ...options
    });
  } catch (err) {
    if (err.name === 'BlobAccessError' || (err.message && err.message.toLowerCase().includes('private'))) {
      return await put(pathname, buffer, {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        ...options
      });
    }
    throw err;
  }
}

// Universal Blob Get helper (supports reading private and public blobs)
async function blobGet(pathname) {
  // 1. Try private get
  try {
    const data = await get(pathname, { access: 'private', useCache: false });
    if (data && data.stream) return data;
  } catch (e) {}

  // 2. Try public get
  try {
    const data = await get(pathname, { access: 'public', useCache: false });
    if (data && data.stream) return data;
  } catch (e) {}

  // 3. Try standard get
  try {
    const data = await get(pathname, { useCache: false });
    if (data && data.stream) return data;
  } catch (e) {}

  // 4. Try list + fetch fallback
  try {
    const { blobs } = await list({ prefix: pathname });
    const target = blobs.find(b => b.pathname === pathname || b.pathname.endsWith(path.basename(pathname)));
    if (target && (target.downloadUrl || target.url)) {
      const url = target.downloadUrl || target.url;
      const resp = await fetch(url);
      if (resp.ok) {
        return { stream: resp.body, size: target.size };
      }
    }
  } catch (e) {}

  return null;
}

// Auto-seed default resumes into Vercel Blob on startup/first load
let blobResumesSeeded = false;
async function ensureVercelBlobResumes() {
  if (!isVercelBlobEnabled() || blobResumesSeeded) return;
  
  try {
    const { blobs } = await list({ prefix: 'resumes/' });
    const pdfBlobs = blobs.filter(b => b.pathname !== 'resumes/' && b.pathname.toLowerCase().endsWith('.pdf'));
    
    if (pdfBlobs.length === 0) {
      console.log('[Blob Startup] Resumes in Vercel Blob are empty. Seeding defaults...');
      
      const cvFile = findWorkspaceFile('public/CV.pdf') || findWorkspaceFile('new_cv.pdf');
      if (cvFile) {
        await blobPut('resumes/Toshal_Zambare_CV.pdf', cvFile.buffer, { contentType: 'application/pdf' });
      }

      const resumeFile = findWorkspaceFile('public/resume.pdf');
      if (resumeFile) {
        await blobPut('resumes/Toshal_Zambare_AI_Resume.pdf', resumeFile.buffer, { contentType: 'application/pdf' });
      }

      const srcNewResumeDir = path.join(__dirname, 'new_resume');
      if (fs.existsSync(srcNewResumeDir)) {
        const files = fs.readdirSync(srcNewResumeDir);
        for (const file of files) {
          if (file.toLowerCase().endsWith('.pdf')) {
            const buf = fs.readFileSync(path.join(srcNewResumeDir, file));
            await blobPut(`resumes/${file}`, buf, { contentType: 'application/pdf' });
          }
        }
      }
      console.log('[Blob Startup] Default resumes seeded to Vercel Blob.');
    }
    blobResumesSeeded = true;
  } catch (err) {
    console.warn('[Blob Startup] Vercel Blob resume check:', err.message);
  }
}

// Log storage mode at startup for debugging
console.log('[Blob Debug] BLOB_READ_WRITE_TOKEN set:', !!process.env.BLOB_READ_WRITE_TOKEN);
console.log('[Blob Debug] BLOB_STORE_ID set:', !!process.env.BLOB_STORE_ID);
console.log('[Blob Debug] VERCEL env:', !!process.env.VERCEL);
console.log('[Blob Debug] isVercelBlobEnabled():', isVercelBlobEnabled());

// Get metadata file content
async function getMetadata() {
  const defaultMeta = { files: [] };
  
  if (isVercelBlobEnabled()) {
    try {
      console.log('[Blob Debug] getMetadata: Resolving private-uploads/metadata.json');
      const blobData = await blobGet('private-uploads/metadata.json');
      
      if (!blobData || !blobData.stream) {
        console.log('[Blob Debug] getMetadata: No metadata blob found, returning default empty list');
        return defaultMeta;
      }
      
      const arrayBuf = await new Response(blobData.stream).arrayBuffer();
      const decrypted = decrypt(Buffer.from(arrayBuf));
      return JSON.parse(decrypted.toString('utf8'));
    } catch (e) {
      console.error('[Blob Debug] Error reading Vercel Blob metadata:', e);
      return defaultMeta;
    }
  } else {
    const metaPath = path.join(UPLOADS_DIR, 'metadata.json');
    if (!fs.existsSync(metaPath)) return defaultMeta;
    try {
      const encryptedData = fs.readFileSync(metaPath);
      const decrypted = decrypt(encryptedData);
      return JSON.parse(decrypted.toString('utf8'));
    } catch (e) {
      console.error('Error reading local metadata file:', e);
      return defaultMeta;
    }
  }
}

// Save metadata file content
async function saveMetadata(metadata) {
  const dataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
  const encrypted = encrypt(dataBuffer);
  
  if (isVercelBlobEnabled()) {
    console.log('[Blob Debug] saveMetadata: Writing encrypted metadata to Blob');
    const result = await blobPut('private-uploads/metadata.json', encrypted, {
      contentType: 'application/octet-stream',
    });
    console.log('[Blob Debug] saveMetadata: Saved to', result.url);
  } else {
    const metaPath = path.join(UPLOADS_DIR, 'metadata.json');
    fs.writeFileSync(metaPath, encrypted);
  }
}

// Save encrypted file
async function saveFile(id, buffer) {
  const encrypted = encrypt(buffer);
  
  if (isVercelBlobEnabled()) {
    console.log(`[Blob Debug] saveFile: Uploading file "${id}" (${encrypted.length} bytes encrypted) to Vercel Blob`);
    const result = await blobPut(`private-uploads/${id}`, encrypted, {
      contentType: 'application/octet-stream',
    });
    console.log(`[Blob Debug] saveFile: Successfully saved to ${result.url}`);
  } else {
    console.log(`[Blob Debug] saveFile: Saving file "${id}" to local disk at ${UPLOADS_DIR}`);
    const filePath = path.join(UPLOADS_DIR, id);
    fs.writeFileSync(filePath, encrypted);
  }
}

// Get decrypted file buffer (Always decrypts and returns original plaintext buffer!)
async function getFile(id) {
  if (isVercelBlobEnabled()) {
    const blobPath = `private-uploads/${id}`;
    console.log(`[Blob Debug] getFile: Reading "${blobPath}" from Vercel Blob`);
    
    const blobData = await blobGet(blobPath);
    if (!blobData || !blobData.stream) {
      throw new Error('File not found in Vercel Blob');
    }
    
    const arrayBuf = await new Response(blobData.stream).arrayBuffer();
    const encryptedBuf = Buffer.from(arrayBuf);
    
    // Decrypt AES-256-GCM ciphertext to return exact original plaintext
    return decrypt(encryptedBuf);
  } else {
    const filePath = path.join(UPLOADS_DIR, id);
    if (!fs.existsSync(filePath)) throw new Error('File not found on local disk');
    
    const encryptedData = fs.readFileSync(filePath);
    return decrypt(encryptedData);
  }
}

// Delete file
async function removeFile(id) {
  if (isVercelBlobEnabled()) {
    const blobPath = `private-uploads/${id}`;
    console.log(`[Blob Debug] removeFile: Resolving "${blobPath}"`);
    try {
      const { blobs } = await list({ prefix: blobPath });
      const targetBlob = blobs.find(b => b.pathname === blobPath || b.pathname.endsWith(id));
      if (targetBlob && targetBlob.url) {
        await del(targetBlob.url);
        console.log(`[Blob Debug] removeFile: Deleted Vercel Blob: ${targetBlob.url}`);
      }
    } catch (e) {
      console.log(`[Blob Debug] removeFile: Blob "${blobPath}" delete skipped:`, e.message);
    }
  } else {
    const filePath = path.join(UPLOADS_DIR, id);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

// ----------------------------------------------------
// Authentication Middleware & Logic
// ----------------------------------------------------
const authenticateJWT = (req, res, next) => {
  const token = req.cookies.admin_session;
  
  if (!token) {
    return res.status(404).json({ error: 'Not Found' }); // Hide presence of admin routes
  }
  
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(404).json({ error: 'Not Found' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(404).json({ error: 'Not Found' });
    }
    req.user = user;
    next();
  });
};

// PBKDF2 verification helper
function verifyPassword(password, salt, storedHash) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, 'sha256', (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey.toString('hex') === storedHash);
    });
  });
}

// ----------------------------------------------------
// API Endpoints
// ----------------------------------------------------

// Admin Login
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  const salt = process.env.ADMIN_PASSWORD_SALT;
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!storedHash || !salt || !jwtSecret) {
    console.error('Server Configuration Error: Admin credentials not configured in .env');
    return res.status(500).json({ error: 'Authentication setup incomplete on server.' });
  }

  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }

  try {
    const isValid = await verifyPassword(password, salt, storedHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Set secure JWT token
    const token = jwt.sign({ admin: true }, jwtSecret, { expiresIn: '15m' });
    
    res.cookie('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return res.json({ success: true, message: 'Authenticated successfully' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin Check Status
app.get('/api/admin/status', (req, res) => {
  const token = req.cookies.admin_session;
  if (!token) return res.json({ authenticated: false });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.json({ authenticated: false });

  jwt.verify(token, jwtSecret, (err) => {
    if (err) return res.json({ authenticated: false });
    return res.json({ authenticated: true });
  });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  res.clearCookie('admin_session');
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Admin: List Files
app.get('/api/admin/files', authenticateJWT, async (req, res) => {
  try {
    const metadata = await getMetadata();
    const sanitizedFiles = metadata.files.map((file, idx) => ({
      index: idx + 1,
      name: file.originalName,
      size: file.size || null,
      uploadedAt: file.uploadedAt,
    }));
    return res.json({ files: sanitizedFiles });
  } catch (error) {
    console.error('List files error:', error);
    return res.status(500).json({ error: 'Failed to retrieve files' });
  }
});

// Setup multer for in-memory upload buffering (max 16MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 },
});

// Admin: Upload File
app.post('/api/admin/upload', authenticateJWT, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileId = crypto.randomUUID();
    const originalName = req.file.originalname;
    
    console.log(`[Upload Debug] Starting upload: "${originalName}" (${req.file.size} bytes), Storage: ${isVercelBlobEnabled() ? 'Vercel Blob' : 'Local Disk'}`);
    
    // Save the encrypted file
    await saveFile(fileId, req.file.buffer);
    
    // Update metadata JSON
    const metadata = await getMetadata();
    metadata.files.push({
      id: fileId,
      originalName,
      size: req.file.size,
      uploadedAt: Date.now(),
    });
    await saveMetadata(metadata);
    
    console.log(`[Upload Debug] Upload complete: "${originalName}" saved as ${fileId}`);
    return res.json({ success: true, message: `Uploaded and encrypted "${originalName}"` });
  } catch (error) {
    console.error('[Upload Debug] Upload error:', error);
    return res.status(500).json({ error: 'Failed to upload file securely' });
  }
});

// ----------------------------------------------------
// Public Resume API: List all resumes
// ----------------------------------------------------
app.get('/api/resumes', async (req, res) => {
  try {
    await ensureVercelBlobResumes();
    
    const listData = [];
    const seenNames = new Set();

    if (isVercelBlobEnabled()) {
      try {
        const { blobs } = await list({ prefix: 'resumes/' });
        for (const blob of blobs) {
          if (blob.pathname === 'resumes/') continue;
          const filename = blob.pathname.replace(/^resumes\//, '');
          if (filename && filename.toLowerCase().endsWith('.pdf') && !seenNames.has(filename.toLowerCase())) {
            seenNames.add(filename.toLowerCase());
            listData.push({
              name: filename,
              url: `/api/resumes/file/${encodeURIComponent(filename)}`,
              size: blob.size,
              uploadedAt: new Date(blob.uploadedAt).getTime()
            });
          }
        }
      } catch (blobErr) {
        console.warn('[Blob] Failed to list resumes from Blob:', blobErr.message);
      }
    }

    // Also check local folders
    const resumeDirsToCheck = [
      RESUMES_DIR,
      path.join(__dirname, 'public', 'resumes'),
      path.join(process.cwd(), 'public', 'resumes'),
      path.join(__dirname, 'new_resume'),
      path.join(process.cwd(), 'new_resume')
    ];

    for (const dir of resumeDirsToCheck) {
      if (fs.existsSync(dir)) {
        try {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            if (file.toLowerCase().endsWith('.pdf') && !seenNames.has(file.toLowerCase())) {
              const filePath = path.join(dir, file);
              const stats = fs.statSync(filePath);
              if (stats.isFile()) {
                seenNames.add(file.toLowerCase());
                listData.push({
                  name: file,
                  url: `/api/resumes/file/${encodeURIComponent(file)}`,
                  size: stats.size,
                  uploadedAt: stats.mtime.getTime()
                });
              }
            }
          }
        } catch (e) {}
      }
    }

    // Ensure Toshal_Zambare_CV.pdf is always present in list
    if (!seenNames.has('toshal_zambare_cv.pdf')) {
      const cvFile = findWorkspaceFile('public/CV.pdf') || findWorkspaceFile('new_cv.pdf');
      if (cvFile) {
        seenNames.add('toshal_zambare_cv.pdf');
        listData.push({
          name: 'Toshal_Zambare_CV.pdf',
          url: `/api/resumes/file/Toshal_Zambare_CV.pdf`,
          size: cvFile.buffer.length,
          uploadedAt: Date.now()
        });
      }
    }

    // Ensure Toshal_Zambare_AI_Resume.pdf is present
    if (!seenNames.has('toshal_zambare_ai_resume.pdf') && !seenNames.has('resume.pdf')) {
      const resumeFile = findWorkspaceFile('public/resume.pdf');
      if (resumeFile) {
        seenNames.add('toshal_zambare_ai_resume.pdf');
        listData.push({
          name: 'Toshal_Zambare_AI_Resume.pdf',
          url: `/api/resumes/file/Toshal_Zambare_AI_Resume.pdf`,
          size: resumeFile.buffer.length,
          uploadedAt: Date.now()
        });
      }
    }

    // Sort: CV first, then newest
    listData.sort((a, b) => {
      const aIsCv = a.name.toLowerCase().includes('cv');
      const bIsCv = b.name.toLowerCase().includes('cv');
      if (aIsCv && !bIsCv) return -1;
      if (!aIsCv && bIsCv) return 1;
      return b.uploadedAt - a.uploadedAt;
    });

    return res.json({ resumes: listData });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// ----------------------------------------------------
// Public Resume API: Proxy Resume File (Allows public access to blobs and local storage)
// ----------------------------------------------------
app.get('/api/resumes/file/:name', async (req, res) => {
  const resumeName = req.params.name;
  if (!resumeName) return res.status(400).json({ error: 'Resume name required' });

  const safeName = path.basename(resumeName);
  const isDownload = req.query.download === 'true' || req.query.download === '1';

  try {
    if (isVercelBlobEnabled()) {
      const blobPath = `resumes/${safeName}`;
      try {
        const blobData = await blobGet(blobPath);
        if (blobData && blobData.stream) {
          const arrayBuf = await new Response(blobData.stream).arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          res.setHeader('Content-Type', 'application/pdf');
          const dispType = isDownload ? 'attachment' : 'inline';
          res.setHeader('Content-Disposition', `${dispType}; filename="${safeName.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
          res.setHeader('Content-Length', buffer.length);
          return res.send(buffer);
        }
      } catch (blobErr) {
        console.warn('[Blob] Could not fetch resume from Blob, falling back:', blobErr.message);
      }
    }

    // Check known local files
    const localSearch = [
      path.join(RESUMES_DIR, safeName),
      path.join(__dirname, 'public', 'resumes', safeName),
      path.join(process.cwd(), 'public', 'resumes', safeName),
      path.join(__dirname, 'dist', 'resumes', safeName),
      path.join(__dirname, 'public', safeName),
      path.join(process.cwd(), 'public', safeName),
      path.join(__dirname, 'new_resume', safeName),
      path.join(process.cwd(), 'new_resume', safeName)
    ];

    for (const filePath of localSearch) {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const dispType = isDownload ? 'attachment' : 'inline';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${dispType}; filename="${safeName.replace(/"/g, '')}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
        return res.sendFile(filePath);
      }
    }

    // Special alias check for CV.pdf and resume.pdf
    if (safeName.toLowerCase().includes('cv')) {
      const cvFile = findWorkspaceFile('public/CV.pdf') || findWorkspaceFile('new_cv.pdf');
      if (cvFile) {
        const dispType = isDownload ? 'attachment' : 'inline';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${dispType}; filename="Toshal_Zambare_CV.pdf"`);
        return res.sendFile(cvFile.path);
      }
    }

    if (safeName.toLowerCase().includes('resume')) {
      const resumeFile = findWorkspaceFile('public/resume.pdf');
      if (resumeFile) {
        const dispType = isDownload ? 'attachment' : 'inline';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${dispType}; filename="Toshal_Zambare_AI_Resume.pdf"`);
        return res.sendFile(resumeFile.path);
      }
    }

    return res.status(404).send('Resume file not found');
  } catch (err) {
    console.error('Error fetching resume file:', err);
    return res.status(500).send('Internal Server Error');
  }
});

// Admin: Upload Resume
app.post('/api/admin/resumes/upload', authenticateJWT, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const originalName = req.file.originalname;
    if (!originalName.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Only PDF resumes are supported' });
    }

    if (isVercelBlobEnabled()) {
      console.log(`[Upload Debug] Uploading resume to Vercel Blob: "resumes/${originalName}"`);
      const result = await blobPut(`resumes/${originalName}`, req.file.buffer, {
        contentType: 'application/pdf'
      });
      console.log(`[Upload Debug] Resume saved to ${result.url}`);
    } else {
      console.log(`[Upload Debug] Saving resume to local folder: ${originalName}`);
      const filePath = path.join(RESUMES_DIR, originalName);
      fs.writeFileSync(filePath, req.file.buffer);
    }

    return res.json({ success: true, message: `Successfully uploaded resume "${originalName}"` });
  } catch (error) {
    console.error('[Upload Debug] Resume upload error:', error);
    return res.status(500).json({ error: 'Failed to upload resume' });
  }
});

// Admin: Delete Resume
app.delete('/api/admin/resumes/:name', authenticateJWT, async (req, res) => {
  const resumeName = req.params.name;
  if (!resumeName) {
    return res.status(400).json({ error: 'Resume name required' });
  }

  const safeName = path.basename(resumeName);

  try {
    if (isVercelBlobEnabled()) {
      const pathname = `resumes/${safeName}`;
      console.log(`[Blob Debug] Deleting resume "${pathname}"`);
      const { blobs } = await list({ prefix: pathname });
      const targetBlob = blobs.find(b => b.pathname === pathname || b.pathname.endsWith(safeName));
      
      if (targetBlob) {
        await del(targetBlob.url);
        console.log(`[Blob Debug] Deleted Vercel Blob: ${targetBlob.url}`);
      } else {
        return res.status(404).json({ error: 'Resume not found in Blob storage' });
      }
    } else {
      const filePath = path.join(RESUMES_DIR, safeName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted local resume: ${filePath}`);
      } else {
        return res.status(404).json({ error: 'Resume not found' });
      }
    }

    return res.json({ success: true, message: `Successfully deleted resume "${safeName}"` });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// Admin: Get File Helper (Shared logic for preview/download)
async function getFileByRequestIndex(req, res) {
  const requestIndex = parseInt(req.params.index, 10);
  if (isNaN(requestIndex) || requestIndex <= 0) {
    return null;
  }

  try {
    const metadata = await getMetadata();
    const fileIndex = requestIndex - 1;
    
    if (fileIndex < 0 || fileIndex >= metadata.files.length) {
      return null;
    }

    const fileRecord = metadata.files[fileIndex];
    // Decrypt file data to get original plaintext buffer
    const fileBuffer = await getFile(fileRecord.id);
    
    return {
      buffer: fileBuffer,
      name: fileRecord.originalName,
    };
  } catch (error) {
    console.error('Get file helper error:', error);
    return null;
  }
}

// Admin: Preview File (Decrypted preview)
app.get('/api/admin/files/:index/preview', authenticateJWT, async (req, res) => {
  const result = await getFileByRequestIndex(req, res);
  if (!result) return res.status(404).json({ error: 'File not found or decryption failed' });

  const fileName = result.name || 'file';
  const ext = path.extname(fileName).toLowerCase();
  const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'];
  
  // For images: wrap in a responsive dark viewer page
  if (imageExts.includes(ext)) {
    const base64 = result.buffer.toString('base64');
    let mimeType = getMimeType(fileName);
    
    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0b0f19; display: flex; justify-content: center; align-items: center; min-height: 100dvh; overflow: hidden; }
    img { max-width: 95vw; max-height: 95dvh; object-fit: contain; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
  </style>
</head><body>
  <img src="data:${mimeType};base64,${base64}" alt="${encodeURIComponent(fileName)}" />
</body></html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.send(html);
  }
  
  // For PDFs on Mobile: render via PDF.js for seamless iframe viewing
  if (ext === '.pdf') {
    const userAgent = req.headers['user-agent'] || '';
    const isMobile = /Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|Kindle|Opera M(obi|ini)/i.test(userAgent);
    
    if (isMobile) {
      const downloadUrl = `/api/admin/files/${req.params.index}/download`;
      const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>PDF Preview</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0b0f19; color: white; display: flex; flex-direction: column; align-items: center; padding: 10px; font-family: sans-serif; min-height: 100dvh; overflow-y: auto; }
    #pdf-container { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
    canvas { max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.5); background: white; }
    .loading { margin-top: 20vh; font-size: 1.1rem; opacity: 0.7; }
  </style>
</head><body>
  <div id="pdf-container"><div class="loading">Loading PDF...</div></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const url = '${downloadUrl}';
    const container = document.getElementById('pdf-container');
    
    pdfjsLib.getDocument(url).promise.then(pdf => {
      container.innerHTML = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        pdf.getPage(pageNum).then(page => {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          container.appendChild(canvas);
          page.render({ canvasContext: context, viewport: viewport });
        });
      }
    }).catch(err => {
      container.innerHTML = '<div class="loading">Error loading PDF. <br><br><a href="' + url + '" style="color: #c5a880; text-decoration: none;">Download File Instead</a></div>';
    });
  </script>
</body></html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      return res.send(html);
    }
  }
  
  // For desktop PDFs and all other files: send raw decrypted content with proper MIME type
  const contentType = getMimeType(fileName);
  const safeAsciiName = fileName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${safeAsciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Length', result.buffer.length);
  return res.send(result.buffer);
});

// Admin: Download File (Always delivers the original decrypted plaintext file!)
app.get('/api/admin/files/:index/download', authenticateJWT, async (req, res) => {
  const result = await getFileByRequestIndex(req, res);
  if (!result) return res.status(404).json({ error: 'File not found or decryption failed' });

  const dlName = result.name || 'download';
  const contentType = getMimeType(dlName);
  const safeAsciiName = dlName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodeURIComponent(dlName)}`);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Content-Length', result.buffer.length);
  
  // Sends the fully decrypted original file buffer
  return res.send(result.buffer);
});

// Admin: Delete All Files
app.delete('/api/admin/files', authenticateJWT, async (req, res) => {
  try {
    const metadata = await getMetadata();
    
    // Delete all files from storage
    for (const file of metadata.files) {
      try {
        await removeFile(file.id);
      } catch (err) {
        console.error(`Failed to remove file ${file.id}:`, err);
      }
    }
    
    // Reset metadata
    metadata.files = [];
    await saveMetadata(metadata);
    
    return res.json({ success: true, message: 'All private files deleted successfully' });
  } catch (error) {
    console.error('Delete all files error:', error);
    return res.status(500).json({ error: 'Failed to delete files securely' });
  }
});

// Admin: Delete Single File
app.delete('/api/admin/files/:index', authenticateJWT, async (req, res) => {
  const requestIndex = parseInt(req.params.index, 10);
  if (isNaN(requestIndex) || requestIndex <= 0) {
    return res.status(404).json({ error: 'Not Found' });
  }

  try {
    const metadata = await getMetadata();
    const fileIndex = requestIndex - 1;
    
    if (fileIndex < 0 || fileIndex >= metadata.files.length) {
      return res.status(404).json({ error: 'Not Found' });
    }

    const fileRecord = metadata.files[fileIndex];
    
    // Remove the physical/blob file
    await removeFile(fileRecord.id);
    
    // Update metadata list
    metadata.files.splice(fileIndex, 1);
    await saveMetadata(metadata);
    
    return res.json({ success: true, message: `Successfully deleted file ${requestIndex}` });
  } catch (error) {
    console.error('Delete file error:', error);
    return res.status(500).json({ error: 'Failed to delete file securely' });
  }
});

// ----------------------------------------------------
// Serve Static Assets & SPA Routing
// ----------------------------------------------------
// Serve static resumes directory
app.use('/resumes', express.static(RESUMES_DIR));

const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.use((req, res) => {
    res.send('Portfolio API Backend Active.');
  });
}

// Start Server (Only listen if NOT running inside Vercel serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`Backend Server listening on port ${PORT}`);
    console.log(`Storage Mode: ${isVercelBlobEnabled() ? 'Vercel Blob Storage' : 'Local Disk Storage'}`);
    console.log(`==================================================\n`);
  });
}

export default app;

