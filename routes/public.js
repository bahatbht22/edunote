const express = require('express');
const router = express.Router();
const pub = require('../controllers/publicController');

router.get('/', pub.index);
router.get('/browse', pub.getLevels);
router.get('/browse/:levelSlug', pub.getCombinations);
router.get('/browse/:levelSlug/:comboSlug', pub.getClasses);
router.get('/browse/:levelSlug/:comboSlug/:classSlug', pub.getNotes);
router.get('/download/:id', pub.downloadNote);
router.get('/read/:id', pub.readNote);
router.get('/stream/:id', pub.streamNote);
router.get('/pdfhtml/:id', pub.pdfToHtml);
router.get('/docx/:id', pub.docxToHtml);
router.get('/text/:id', pub.textNote);

module.exports = router;
