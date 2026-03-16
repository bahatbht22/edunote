const express = require('express');
const router  = express.Router();
const pub     = require('../controllers/publicController');

router.get('/',                                              pub.index);
router.get('/notes',                                         pub.getLevels);
router.get('/notes/:levelSlug',                              pub.getCombinations);
router.get('/notes/:levelSlug/:comboSlug',                   pub.getClasses);
router.get('/notes/:levelSlug/:comboSlug/:classSlug',        pub.getNotes);
router.get('/read/:id',                                      pub.readNote);
router.get('/download/:id',                                  pub.downloadNote);
router.get('/view/:id',                                      pub.viewNote);

module.exports = router;
