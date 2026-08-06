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

// Copy default resumes from workspace folders if they exist and local resumes folder is empty
try {
  const localResumes = fs.readdirSync(RESUMES_DIR);
  if (localResumes.filter(f => f.toLowerCase().endsWith('.pdf')).length === 0) {
    console.log('[Startup] Resumes folder is empty. Copying defaults...');
    // Copy public/resume.pdf
    const defaultResumePath = path.join(__dirname, 'public', 'resume.pdf');
    if (fs.existsSync(defaultResumePath)) {
      fs.copyFileSync(defaultResumePath, path.join(RESUMES_DIR, 'Toshal_Zambare_AI_Resume.pdf'));
    }
    // Copy from new_resume folder if exists
    const srcNewResumeDir = path.join(__dirname, 'new_resume');
    if (fs.existsSync(srcNewResumeDir)) {
      const defaultFiles = fs.readdirSync(srcNewResumeDir);
      for (const file of defaultFiles) {
        if (file.toLowerCase().endsWith('.pdf')) {
          fs.copyFileSync(path.join(srcNewResumeDir, file), path.join(RESUMES_DIR, file));
        }
      }
    }
    console.log('[Startup] Default resumes copied.');
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

// Rate limiting to prevent brute forcing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 API requests per windowMs
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply API rate limiting
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

// Encrypt file buffer
function encrypt(buffer) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // GCM standard IV is 12 bytes
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes auth tag
  
  // Combine: [IV (12 bytes) | Tag (16 bytes) | Encrypted Data]
  return Buffer.concat([iv, tag, encrypted]);
}

// Decrypt file buffer
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

// ----------------------------------------------------
// Storage Adapters (Local Filesystem vs Vercel Blob)
// ----------------------------------------------------
const isVercelBlobEnabled = () => {
  // BLOB_STORE_ID is set when a Blob store is linked to the project.
  // The @vercel/blob SDK internally resolves auth via its @vercel/oidc dependency
  // at request time — we do NOT need VERCEL_OIDC_TOKEN in the environment.
  // BLOB_READ_WRITE_TOKEN is the legacy static token fallback.
  return !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
};

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
      console.log('[Blob Debug] getMetadata: Reading metadata via get(pathname)');
      const blobData = await get('private-uploads/metadata.json', { access: 'private', useCache: false });
      
      // get() returns null if the blob doesn't exist
      if (!blobData) {
        console.log('[Blob Debug] getMetadata: No metadata blob found, returning defaults');
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
    const result = await put('private-uploads/metadata.json', encrypted, {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
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
    const result = await put(`private-uploads/${id}`, encrypted, {
      access: 'private',
      addRandomSuffix: false,
      contentType: 'application/octet-stream',
    });
    console.log(`[Blob Debug] saveFile: Successfully saved to ${result.url}`);
  } else {
    console.log(`[Blob Debug] saveFile: Saving file "${id}" to local disk at ${UPLOADS_DIR}`);
    const filePath = path.join(UPLOADS_DIR, id);
    fs.writeFileSync(filePath, encrypted);
  }
}

// Get decrypted file buffer
async function getFile(id) {
  if (isVercelBlobEnabled()) {
    const blobPath = `private-uploads/${id}`;
    console.log(`[Blob Debug] getFile: Reading "${blobPath}" via get(pathname)`);
    
    const blobData = await get(blobPath, { access: 'private', useCache: false });
    if (!blobData) throw new Error('File not found in Vercel Blob');
    
    console.log(`[Blob Debug] getFile: Got blob, reading stream`);
    const arrayBuf = await new Response(blobData.stream).arrayBuffer();
    return decrypt(Buffer.from(arrayBuf));
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
    console.log(`[Blob Debug] removeFile: Resolving "${blobPath}" via head()`);
    try {
      const blobMeta = await head(blobPath);
      console.log(`[Blob Debug] removeFile: Deleting ${blobMeta.url}`);
      await del(blobMeta.url);
    } catch (e) {
      // head() throws BlobNotFoundError if not found — silently skip
      console.log(`[Blob Debug] removeFile: Blob "${blobPath}" not found, skipping`);
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

// Admin Check Status (Verify if still authenticated)
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

// Admin: List Files (Access strictly guarded)
app.get('/api/admin/files', authenticateJWT, async (req, res) => {
  try {
    const metadata = await getMetadata();
    // Return sanitized file information (do not leak internal IDs to the client)
    const sanitizedFiles = metadata.files.map((file, idx) => ({
      index: idx + 1, // transient 1-based index
      name: file.originalName,
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
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB limit
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
    const listData = [];
    if (isVercelBlobEnabled()) {
      const { blobs } = await list({ prefix: 'resumes/' });
      for (const blob of blobs) {
        if (blob.pathname === 'resumes/') continue;
        const filename = blob.pathname.replace('resumes/', '');
        listData.push({
          name: filename,
          url: `/api/resumes/file/${encodeURIComponent(filename)}`,
          size: blob.size,
          uploadedAt: new Date(blob.uploadedAt).getTime()
        });
      }
    } else {
      if (fs.existsSync(RESUMES_DIR)) {
        const files = fs.readdirSync(RESUMES_DIR);
        for (const file of files) {
          const filePath = path.join(RESUMES_DIR, file);
          const stats = fs.statSync(filePath);
          if (stats.isFile()) {
            listData.push({
              name: file,
              url: `/api/resumes/file/${encodeURIComponent(file)}`,
              size: stats.size,
              uploadedAt: stats.mtime.getTime()
            });
          }
        }
      }
    }
    
    // Sort: newer first
    listData.sort((a, b) => b.uploadedAt - a.uploadedAt);
    
    return res.json({ resumes: listData });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// ----------------------------------------------------
// Public Resume API: Proxy Resume File (Allows public access to private blobs)
// ----------------------------------------------------
app.get('/api/resumes/file/:name', async (req, res) => {
  const resumeName = req.params.name;
  if (!resumeName) return res.status(400).json({ error: 'Resume name required' });

  try {
    if (isVercelBlobEnabled()) {
      const blobPath = `resumes/${resumeName}`;
      try {
        const blobData = await get(blobPath, { access: 'private', useCache: false });
        if (!blobData) return res.status(404).send('Not Found');
        
        res.setHeader('Content-Type', 'application/pdf');
        // stream the response
        const arrayBuf = await new Response(blobData.stream).arrayBuffer();
        return res.send(Buffer.from(arrayBuf));
      } catch (e) {
        return res.status(404).send('Resume not found in Blob');
      }
    } else {
      const filePath = path.join(RESUMES_DIR, resumeName);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        return res.sendFile(filePath);
      } else {
        return res.status(404).send('Not Found');
      }
    }
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
      const result = await put(`resumes/${originalName}`, req.file.buffer, {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
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

  try {
    if (isVercelBlobEnabled()) {
      const pathname = `resumes/${resumeName}`;
      console.log(`[Blob Debug] Deleting resume "${pathname}"`);
      const { blobs } = await list({ prefix: pathname });
      const targetBlob = blobs.find(b => b.pathname === pathname);
      
      if (targetBlob) {
        await del(targetBlob.url);
        console.log(`[Blob Debug] Deleted Vercel Blob: ${targetBlob.url}`);
      } else {
        return res.status(404).json({ error: 'Resume not found in Blob storage' });
      }
    } else {
      const filePath = path.join(RESUMES_DIR, resumeName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted local resume: ${filePath}`);
      } else {
        return res.status(404).json({ error: 'Resume not found' });
      }
    }

    return res.json({ success: true, message: `Successfully deleted resume "${resumeName}"` });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// Admin: Get File Helper (Shared logic for preview/download)
async function getFileByRequestIndex(req, res) {
  const requestIndex = parseInt(req.params.index, 10);
  if (isNaN(requestIndex) || requestIndex <= 0) {
    return res.status(404).json({ error: 'Not Found' });
  }

  try {
    const metadata = await getMetadata();
    const fileIndex = requestIndex - 1;
    
    if (fileIndex >= metadata.files.length) {
      return res.status(404).json({ error: 'Not Found' });
    }

    const fileRecord = metadata.files[fileIndex];
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

// Admin: Preview File
app.get('/api/admin/files/:index/preview', authenticateJWT, async (req, res) => {
  const result = await getFileByRequestIndex(req, res);
  if (!result) return res.status(404).json({ error: 'Not Found' });

  // Infer content type from file extension (guard against missing name)
  const fileName = result.name || 'file';
  const ext = path.extname(fileName).toLowerCase();
  const imageExts = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg'];
  
  // For images: wrap in a styled HTML page so they display properly in the iframe
  if (imageExts.includes(ext)) {
    const base64 = result.buffer.toString('base64');
    let mimeType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.webp') mimeType = 'image/webp';
    else if (ext === '.gif') mimeType = 'image/gif';
    else if (ext === '.bmp') mimeType = 'image/bmp';
    else if (ext === '.svg') mimeType = 'image/svg+xml';
    
    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0b0f19; display: flex; justify-content: center; align-items: center; min-height: 100dvh; overflow: hidden; }
    img { max-width: 95vw; max-height: 95dvh; object-fit: contain; border-radius: 4px; }
  </style>
</head><body>
  <img src="data:${mimeType};base64,${base64}" alt="${encodeURIComponent(fileName)}" />
</body></html>`;
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, no-store, max-age=0');
    return res.send(html);
  }
  
  // For PDFs: Mobile browsers often fail to display inline PDFs in iframes.
  // We use Mozilla's PDF.js to render the PDF reliably on mobile devices.
  // For desktop, we let it fall through to serve the raw PDF so users get native viewer features.
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
    
    // Fetch PDF securely via the download endpoint (cookies are sent automatically)
    const url = '${downloadUrl}';
    const container = document.getElementById('pdf-container');
    
    pdfjsLib.getDocument(url).promise.then(pdf => {
      container.innerHTML = ''; // clear loading text
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        pdf.getPage(pageNum).then(page => {
          // Render at 1.5x scale for better text crispness on high DPI screens
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
      container.innerHTML = '<div class="loading">Error loading PDF. <br><br><a href="' + url + '" style="color: #64ffda; text-decoration: none;">Download File Instead</a></div>';
      console.error(err);
    });
  </script>
</body></html>`;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'private, no-store, max-age=0');
      return res.send(html);
    }
    // If desktop, it falls through to the raw response below.
  }
  
  // For other non-image files (and desktop PDFs): send raw content with correct mime type
  let contentType = 'application/octet-stream';
  if (ext === '.pdf') contentType = 'application/pdf';
  else if (ext === '.txt' || ext === '.md') contentType = 'text/plain; charset=utf-8';
  else if (ext === '.json') contentType = 'application/json';

  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return res.send(result.buffer);
});

// Admin: Download File
app.get('/api/admin/files/:index/download', authenticateJWT, async (req, res) => {
  const result = await getFileByRequestIndex(req, res);
  if (!result) return res.status(404).json({ error: 'Not Found' });

  const dlName = result.name || 'download';
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(dlName)}"`);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
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

// Admin: Delete File
app.delete('/api/admin/files/:index', authenticateJWT, async (req, res) => {
  const requestIndex = parseInt(req.params.index, 10);
  if (isNaN(requestIndex) || requestIndex <= 0) {
    return res.status(404).json({ error: 'Not Found' });
  }

  try {
    const metadata = await getMetadata();
    const fileIndex = requestIndex - 1;
    
    if (fileIndex >= metadata.files.length) {
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
    res.send('Development mode. Front-end served via Vite on port 3000. Express Backend listening on port 5000.');
  });
}

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`Backend Server listening on port ${PORT}`);
  console.log(`Storage Mode: ${isVercelBlobEnabled() ? 'Vercel Blob Storage' : 'Local Disk Storage'}`);
  console.log(`==================================================\n`);
});

export default app;
