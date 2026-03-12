const Level = require('../models/Level');
const Combination = require('../models/Combination');
const Class = require('../models/Class');
const Note = require('../models/Note');


// Helper: resolve file path from note record
function resolveFilePath(note, pathModule, fs) {
  // file_url is a full local disk path (legacy uploads)
  if (note.file_url && note.file_url.length > 0 && !note.file_url.startsWith('http')) {
    if (fs.existsSync(note.file_url)) return note.file_url;
    const fallback = pathModule.join(__dirname, '../uploads', pathModule.basename(note.file_url));
    if (fs.existsSync(fallback)) return fallback;
  }
  // Standard: file_name in uploads folder
  const p = pathModule.join(__dirname, '../uploads', note.file_name);
  if (fs.existsSync(p)) return p;
  return null;
}


function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

module.exports = {
  // Homepage
  index: async (req, res) => {
    try {
      const levels = await Level.findAll();
      const noteCount = await Note.countAll();
      const comboCount = await Combination.countAll();
      res.render('public/index', {
        layout: 'layouts/public',
        title: 'EduNote — Rwanda Education Notes',
        levels,
        noteCount,
        comboCount
      });
    } catch (err) {
      console.error(err);
      res.render('public/error', { layout: 'layouts/public', title: 'Error', message: 'Something went wrong.' });
    }
  },

  // Show all levels
  getLevels: async (req, res) => {
    try {
      const levels = await Level.findAll();
      res.render('public/levels', {
        layout: 'layouts/public',
        title: 'Browse by Level — EduNote',
        levels
      });
    } catch (err) {
      console.error(err);
      res.render('public/error', { layout: 'layouts/public', title: 'Error', message: 'Something went wrong.' });
    }
  },

  // Combinations inside a level
  getCombinations: async (req, res) => {
    try {
      const level = await Level.findBySlug(req.params.levelSlug);
      if (!level) return res.status(404).render('public/error', { layout: 'layouts/public', title: 'Not Found', message: 'Level not found.' });

      const combinations = await Combination.findByLevel(level.id);

      // Count notes per combination
      for (let combo of combinations) {
        const classes = await Class.findByCombination(combo.id);
        let noteCount = 0;
        for (let cls of classes) {
          const notes = await Note.findByClass(cls.id);
          noteCount += notes.length;
        }
        combo.note_count = noteCount;
        combo.class_count = classes.length;
      }

      res.render('public/combinations', {
        layout: 'layouts/public',
        title: `${level.name} — EduNote`,
        level,
        combinations
      });
    } catch (err) {
      console.error(err);
      res.render('public/error', { layout: 'layouts/public', title: 'Error', message: 'Something went wrong.' });
    }
  },

  // Classes inside a combination
  getClasses: async (req, res) => {
    try {
      const level = await Level.findBySlug(req.params.levelSlug);
      if (!level) return res.status(404).render('public/error', { layout: 'layouts/public', title: 'Not Found', message: 'Level not found.' });

      const combo = await Combination.findBySlug(level.id, req.params.comboSlug);
      if (!combo) return res.status(404).render('public/error', { layout: 'layouts/public', title: 'Not Found', message: 'Combination not found.' });

      const classes = await Class.findByCombination(combo.id);

      for (let cls of classes) {
        const notes = await Note.findByClass(cls.id);
        cls.note_count = notes.length;
      }

      res.render('public/classes', {
        layout: 'layouts/public',
        title: `${combo.name} — ${level.name} — EduNote`,
        level,
        combo,
        classes
      });
    } catch (err) {
      console.error(err);
      res.render('public/error', { layout: 'layouts/public', title: 'Error', message: 'Something went wrong.' });
    }
  },

  // Notes inside a class
  getNotes: async (req, res) => {
    try {
      const level = await Level.findBySlug(req.params.levelSlug);
      if (!level) return res.status(404).render('public/error', { layout: 'layouts/public', title: 'Not Found', message: 'Level not found.' });

      const combo = await Combination.findBySlug(level.id, req.params.comboSlug);
      if (!combo) return res.status(404).render('public/error', { layout: 'layouts/public', title: 'Not Found', message: 'Combination not found.' });

      const cls = await Class.findBySlug(combo.id, req.params.classSlug);
      if (!cls) return res.status(404).render('public/error', { layout: 'layouts/public', title: 'Not Found', message: 'Class not found.' });

      const notes = await Note.findByClass(cls.id);

      // Get sibling classes for tab switcher
      const siblingClasses = await Class.findByCombination(combo.id);

      res.render('public/notes', {
        layout: 'layouts/public',
        title: `${cls.name} Notes — ${combo.name} — EduNote`,
        level,
        combo,
        cls,
        notes,
        siblingClasses
      });
    } catch (err) {
      console.error(err);
      res.render('public/error', { layout: 'layouts/public', title: 'Error', message: 'Something went wrong.' });
    }
  },

  // Download note
  downloadNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).send('Note not found');

      await Note.incrementDownload(note.id);

      const pathModule = require('path');
      const fs = require('fs');

      // Log for debugging
      console.log('DOWNLOAD REQUEST:', {
        id: note.id,
        title: note.title,
        file_name: note.file_name,
        file_original_name: note.file_original_name,
        file_url: note.file_url,
        file_type: note.file_type
      });

      // Cloudinary HTTP URL
      if (note.file_url && note.file_url.startsWith('http')) {
        console.log('Redirecting to Cloudinary URL');
        return res.redirect(note.file_url);
      }

      // file_url is a full local disk path
      if (note.file_url && note.file_url.length > 0 && !note.file_url.startsWith('http')) {
        const localPath = fs.existsSync(note.file_url)
          ? note.file_url
          : pathModule.join(__dirname, '../uploads', pathModule.basename(note.file_url));

        console.log('Sending file:', localPath, '| exists:', fs.existsSync(localPath));

        if (fs.existsSync(localPath)) {
          res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.file_original_name)}"`);
          res.setHeader('Content-Type', 'application/octet-stream');
          return fs.createReadStream(localPath).pipe(res);
        }
      }

      // Try uploads folder with stored filename
      const filePath = pathModule.join(__dirname, '../uploads', note.file_name);
      console.log('Trying uploads path:', filePath, '| exists:', fs.existsSync(filePath));
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(note.file_original_name)}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        return fs.createReadStream(filePath).pipe(res);
      }

      // Try with original name directly
      const filePath2 = pathModule.join(__dirname, '../uploads', note.file_original_name);
      if (fs.existsSync(filePath2)) {
        return res.download(filePath2, note.file_original_name);
      }

      // List what IS in uploads folder
      const uploadsDir = pathModule.join(__dirname, '../uploads');
      const files = fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir) : [];
      console.log('Files in uploads folder:', files);

      res.status(404).send(`
        <h2>File not found</h2>
        <p><b>Looking for:</b> ${note.file_name}</p>
        <p><b>In folder:</b> ${uploadsDir}</p>
        <p><b>Files present:</b> ${files.join(', ') || 'none'}</p>
        <p><b>file_url saved:</b> ${note.file_url || 'empty'}</p>
        <a href="javascript:history.back()">← Go back</a>
      `);
    } catch (err) {
      console.error('Download error:', err);
      res.status(500).send('Error: ' + err.message);
    }
  },

  // Read note online (reader page)
  readNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).render('public/error', { layout: 'layouts/public', title: 'Not Found', message: 'Note not found.' });

      const ext = (note.file_original_name || note.file_name || '').split('.').pop().toLowerCase().trim();

      res.render('public/reader', {
        layout: 'layouts/reader',
        title: `Reading: ${note.title}`,
        note,
        ext
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error loading reader');
    }
  },


  // Convert PDF to HTML for inline reading
  pdfToHtml: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).send('Note not found');
      const pathModule = require('path');
      const fsModule   = require('fs');
      const os         = require('os');

      // Resolve file — download from Cloudinary to temp if needed
      let filePath = null;
      let tempFile = null;

      if (note.file_url && note.file_url.startsWith('http')) {
        tempFile = pathModule.join(os.tmpdir(), 'edunote_pdf_' + note.id + '_' + Date.now() + '.pdf');
        const fetch = require('node-fetch');
        const resp  = await fetch(note.file_url);
        if (!resp.ok) return res.status(502).send('Could not fetch file from storage (' + resp.status + ')');
        const buf = await resp.buffer();
        fsModule.writeFileSync(tempFile, buf);
        filePath = tempFile;
      } else {
        filePath = resolveFilePath(note, pathModule, fsModule);
        if (!filePath) return res.status(404).send('File not found on server');
      }

      const PDFParser = require('pdf2json');

      const html = await new Promise((resolve, reject) => {
        const parser = new PDFParser(null, 1);

        parser.on('pdfParser_dataReady', (data) => {
          try {
            const pages = data.Pages || [];
            if (!pages.length) return resolve('<p style="color:#888;text-align:center;padding:2rem">This PDF has no extractable text. Please download it to view.</p>');
            let out = '';
            pages.forEach((page, pi) => {
              out += '<div class="pdf-pg" id="pg' + (pi+1) + '">';
              if (pages.length > 1) out += '<div class="pdf-pg-num">Page ' + (pi+1) + ' of ' + pages.length + '</div>';
              const rows = {};
              (page.Texts || []).forEach(t => {
                const y = Math.round(t.y * 3);
                if (!rows[y]) rows[y] = [];
                const txt  = t.R.map(r => { try { return decodeURIComponent(r.T); } catch(e) { return r.T; } }).join('');
                const size = t.R[0] && t.R[0].TS ? t.R[0].TS[1] : 12;
                const bold = t.R.some(r => r.TS && r.TS[2] === 1);
                rows[y].push({ x: t.x, txt, size, bold });
              });
              Object.keys(rows).sort((a,b)=>+a-+b).forEach(y => {
                const items = rows[y].sort((a,b)=>a.x-b.x);
                const text  = items.map(i=>i.bold?'<strong>'+esc(i.txt)+'</strong>':esc(i.txt)).join(' ').trim();
                if (!text) return;
                const sz  = items[0].size;
                const tag = sz >= 20 ? 'h1' : sz >= 16 ? 'h2' : sz >= 13 ? 'h3' : 'p';
                out += '<' + tag + '>' + text + '</' + tag + '>';
              });
              out += '</div>';
            });
            resolve(out || '<p style="text-align:center;padding:2rem;color:#888">No readable text found in this PDF.</p>');
          } catch(e) { reject(e); }
        });

        parser.on('pdfParser_dataError', errData => {
          reject(new Error('PDF parse failed: ' + String(errData && errData.parserError ? errData.parserError : errData)));
        });

        parser.loadPDF(filePath);
      });

      if (tempFile) try { fsModule.unlinkSync(tempFile); } catch(e) {}
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(html);
    } catch(err) {
      console.error('pdfToHtml error:', err.message);
      res.status(500).send('Error reading PDF: ' + err.message);
    }
  },

  // Convert DOCX to HTML for online reading
  docxToHtml: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).send('Note not found');
      const pathModule = require('path');
      const fs = require('fs');
      const mammoth = require('mammoth');
      const filePath = resolveFilePath(note, pathModule, fs);
      if (!filePath) return res.status(404).send('File not found');
      const result = await mammoth.convertToHtml({ path: filePath });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(result.value);
    } catch (err) {
      console.error('DOCX convert error:', err);
      res.status(500).send('Error: ' + err.message);
    }
  },

  // Serve TXT as plain text
  textNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).send('Note not found');
      const pathModule = require('path');
      const fs = require('fs');
      const filePath = resolveFilePath(note, pathModule, fs);
      if (!filePath) return res.status(404).send('File not found');
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      fs.createReadStream(filePath).pipe(res);
    } catch (err) {
      res.status(500).send('Error: ' + err.message);
    }
  },

  // Stream PDF inline
  streamNote: async (req, res) => {
    try {
      const note = await Note.findById(req.params.id);
      if (!note) return res.status(404).send('Note not found');
      const pathModule = require('path');
      const fs = require('fs');
      // Cloudinary
      if (note.file_url && note.file_url.startsWith('http')) {
        try {
          const fetch = require('node-fetch');
          const response = await fetch(note.file_url);
          if (!response.ok) throw new Error('Fetch failed: ' + response.status);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          return response.body.pipe(res);
        } catch(e) { return res.redirect(note.file_url); }
      }
      // Local disk — resolveFilePath handles file_url full path
      const filePath = resolveFilePath(note, pathModule, fs);
      if (filePath) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        return fs.createReadStream(filePath).pipe(res);
      }
      res.status(404).send('File not found');
    } catch(err) {
      console.error('Stream error:', err);
      res.status(500).send('Error streaming file');
    }
  }
};
