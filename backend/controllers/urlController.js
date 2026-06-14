const Url = require('../models/Url');
const Visit = require('../models/Visit');
const generateShortCode = require('../utils/generateShortCode');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: prepend protocol and validate URL
// ─────────────────────────────────────────────────────────────────────────────
function normaliseUrl(raw) {
  let url = raw.trim();
  if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
  if (!validator.isURL(url)) throw Object.assign(new Error('Please enter a valid URL'), { status: 400 });
  return url;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: generate unique short code (max 5 attempts)
// ─────────────────────────────────────────────────────────────────────────────
async function makeUniqueCode(customAlias) {
  if (customAlias) {
    const exists = await Url.findOne({ shortCode: customAlias.trim() });
    if (exists) throw Object.assign(new Error('Custom alias already taken'), { status: 409 });
    return customAlias.trim();
  }
  for (let i = 0; i < 5; i++) {
    const code = generateShortCode();
    if (!(await Url.findOne({ shortCode: code }))) return code;
  }
  throw Object.assign(new Error('Failed to generate a unique short code'), { status: 500 });
}

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Create a new shortened URL
// @route  POST /api/urls
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const createUrl = async (req, res, next) => {
  try {
    const { originalUrl, expiresAt, customAlias, password, clickLimit, tags, isPublicStats } = req.body;

    if (!originalUrl) {
      res.status(400);
      throw new Error('Original URL is required');
    }

    const targetUrl = normaliseUrl(originalUrl);
    const shortCode = await makeUniqueCode(customAlias);

    let expiryDate = null;
    if (expiresAt) {
      expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) { res.status(400); throw new Error('Invalid expiry date'); }
      if (expiryDate <= new Date()) { res.status(400); throw new Error('Expiry date must be in the future'); }
    }

    const newUrl = new Url({
      originalUrl: targetUrl,
      shortCode,
      createdBy: req.user._id,
      expiresAt: expiryDate,
      clickLimit: clickLimit ? Number(clickLimit) : null,
      tags: Array.isArray(tags) ? tags : [],
      isPublicStats: isPublicStats !== undefined ? Boolean(isPublicStats) : true,
    });

    // Set password if provided (pre-save hook hashes it)
    if (password) newUrl.password = password;

    await newUrl.save();

    res.status(201).json({ success: true, url: newUrl });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Bulk create shortened URLs from an array
// @route  POST /api/urls/bulk
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const bulkCreateUrls = async (req, res, next) => {
  try {
    const { urls } = req.body; // [{ originalUrl, expiresAt?, tags? }]

    if (!Array.isArray(urls) || urls.length === 0) {
      res.status(400);
      throw new Error('urls array is required');
    }

    const results = [];

    for (const item of urls) {
      try {
        const targetUrl = normaliseUrl(item.originalUrl || '');
        const shortCode = await makeUniqueCode(null);

        let expiryDate = null;
        if (item.expiresAt) {
          expiryDate = new Date(item.expiresAt);
          if (isNaN(expiryDate.getTime())) expiryDate = null;
        }

        const newUrl = await Url.create({
          originalUrl: targetUrl,
          shortCode,
          createdBy: req.user._id,
          expiresAt: expiryDate,
          tags: Array.isArray(item.tags) ? item.tags : [],
        });

        results.push({ success: true, originalUrl: item.originalUrl, url: newUrl });
      } catch (err) {
        results.push({ success: false, originalUrl: item.originalUrl, error: err.message });
      }
    }

    res.status(201).json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Get all URLs for the current user (with optional search)
// @route  GET /api/urls
// @route  GET /api/urls?q=<query>
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getUrls = async (req, res, next) => {
  try {
    const { q, sort, filter } = req.query;
    const query = { createdBy: req.user._id };

    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [{ originalUrl: regex }, { shortCode: regex }];
    }

    const now = new Date();
    if (filter === 'active') {
      query.$or = [{ expiresAt: null }, { expiresAt: { $gt: now } }];
    } else if (filter === 'expired') {
      query.expiresAt = { $ne: null, $lte: now };
    } else if (filter === 'favorites') {
      query.isFavorite = true;
    }

    if (filter === 'archived') {
      query.isArchived = true;
    } else {
      query.isArchived = { $ne: true };
    }

    let sortOpt = { createdAt: -1 };
    if (sort === 'oldest') sortOpt = { createdAt: 1 };
    if (sort === 'clicks') sortOpt = { clickCount: -1 };

    const urls = await Url.find(query).sort(sortOpt);
    res.status(200).json({ success: true, count: urls.length, urls });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Search URLs by query
// @route  GET /api/urls/search?q=
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const searchUrls = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json({ success: true, count: 0, urls: [] });

    const regex = new RegExp(q, 'i');
    const urls = await Url.find({
      createdBy: req.user._id,
      $or: [{ originalUrl: regex }, { shortCode: regex }],
    }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: urls.length, urls });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Get single URL
// @route  GET /api/urls/:id
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getUrlById = async (req, res, next) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!url) { res.status(404); throw new Error('URL not found or unauthorized'); }
    res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Update URL details
// @route  PUT /api/urls/:id
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const updateUrl = async (req, res, next) => {
  try {
    const { originalUrl, expiresAt, tags, isPublicStats, isArchived } = req.body;
    const url = await Url.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!url) { res.status(404); throw new Error('URL not found or unauthorized'); }

    if (originalUrl !== undefined) {
      url.originalUrl = normaliseUrl(originalUrl);
    }

    if (expiresAt !== undefined) {
      if (expiresAt === null) {
        url.expiresAt = null;
      } else {
        const d = new Date(expiresAt);
        if (isNaN(d.getTime())) { res.status(400); throw new Error('Invalid expiry date'); }
        url.expiresAt = d;
      }
    }

    if (tags !== undefined) url.tags = Array.isArray(tags) ? tags : [];
    if (isPublicStats !== undefined) url.isPublicStats = Boolean(isPublicStats);
    if (isArchived !== undefined) url.isArchived = Boolean(isArchived);

    await url.save();
    res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Delete URL and its analytics
// @route  DELETE /api/urls/:id
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const deleteUrl = async (req, res, next) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!url) { res.status(404); throw new Error('URL not found or unauthorized'); }

    await Visit.deleteMany({ urlId: url._id });
    await Url.deleteOne({ _id: url._id });

    res.status(200).json({ success: true, message: 'URL and analytics deleted' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Set password on URL
// @route  PATCH /api/urls/:id/password
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const setPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const url = await Url.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!url) { res.status(404); throw new Error('URL not found'); }

    if (password) {
      url.password = password; // pre-save hook hashes it
    } else {
      url.password = null;
    }

    await url.save();
    res.status(200).json({ success: true, message: password ? 'Password set' : 'Password removed' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Verify password for protected URL
// @route  POST /api/urls/:id/verify-password
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const verifyPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    const mongoose = require('mongoose');
    const isId = mongoose.Types.ObjectId.isValid(req.params.id);
    const url = isId 
      ? await Url.findById(req.params.id)
      : await Url.findOne({ shortCode: req.params.id });

    if (!url) { res.status(404); throw new Error('URL not found'); }

    if (!url.password) return res.status(200).json({ success: true, valid: true });

    const valid = await url.verifyPassword(password);
    if (!valid) { res.status(401); throw new Error('Incorrect password'); }

    res.status(200).json({ success: true, valid: true, originalUrl: url.originalUrl });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Set click limit on URL
// @route  PATCH /api/urls/:id/click-limit
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const setClickLimit = async (req, res, next) => {
  try {
    const { clickLimit } = req.body;
    const url = await Url.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!url) { res.status(404); throw new Error('URL not found'); }

    url.clickLimit = clickLimit ? Number(clickLimit) : null;
    await url.save();

    res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Toggle favorite status
// @route  POST /api/urls/:id/favorite
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const toggleFavorite = async (req, res, next) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!url) {
      return res.status(404).json({ message: 'URL not found' });
    }

    url.isFavorite = !url.isFavorite;
    await url.save();

    res.status(200).json({ success: true, url, isFavorite: url.isFavorite });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Public stats for a URL (no auth required)
// @route  GET /api/urls/:id/public-stats
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const getPublicStats = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    const isId = mongoose.Types.ObjectId.isValid(req.params.id);
    const url = isId 
      ? await Url.findById(req.params.id)
      : await Url.findOne({ shortCode: req.params.id });

    if (!url) { res.status(404); throw new Error('URL not found'); }
    if (!url.isPublicStats) { res.status(403); throw new Error('Public stats are disabled for this link'); }

    const visits = await Visit.find({ urlId: url._id }).sort({ timestamp: -1 });
    const lastVisited = visits.length > 0 ? visits[0].timestamp : null;

    // Browser breakdown
    const browserCounts = {};
    visits.forEach(v => {
      const ua = (v.userAgent || '').toLowerCase();
      let b = 'Other';
      if (ua.includes('edg')) b = 'Edge';
      else if (ua.includes('chrome') && !ua.includes('opr')) b = 'Chrome';
      else if (ua.includes('safari') && !ua.includes('chrome')) b = 'Safari';
      else if (ua.includes('firefox')) b = 'Firefox';
      else if (ua.includes('opera') || ua.includes('opr')) b = 'Opera';
      browserCounts[b] = (browserCounts[b] || 0) + 1;
    });

    // Daily last 7 days
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const count = visits.filter(v => new Date(v.timestamp).toISOString().split('T')[0] === ds).length;
      dailyTrend.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), clicks: count });
    }

    res.status(200).json({
      success: true,
      stats: {
        clickCount: url.clickCount,
        createdAt: url.createdAt,
        lastVisited,
        shortCode: url.shortCode,
        browserStats: Object.keys(browserCounts).map(k => ({ name: k, value: browserCounts[k] })),
        dailyTrend,
      }
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Redirect short URL → original (handles password + click limit)
// @route  GET /r/:shortCode
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const url = await Url.findOne({ shortCode });

    if (!url) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(404); throw new Error('Short URL not found');
      }
      return res.redirect(`${frontendUrl}/not-found`);
    }

    // Check expiry
    if (url.expiresAt && new Date(url.expiresAt) <= new Date()) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(410); throw new Error('Short URL has expired');
      }
      return res.redirect(`${frontendUrl}/expired`);
    }

    // Check click limit
    if (url.clickLimit !== null && url.clickCount >= url.clickLimit) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(429); throw new Error('Click limit reached');
      }
      return res.redirect(`${frontendUrl}/click-limit`);
    }

    // Check password protection
    if (url.password) {
      if (req.headers.accept?.includes('application/json')) {
        res.status(403); throw new Error('Password required');
      }
      return res.redirect(`${frontendUrl}/gate/${shortCode}`);
    }

    // Record visit details
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
    const ipAddress = typeof rawIp === 'string' && rawIp.startsWith('::ffff:') ? rawIp.replace('::ffff:', '') : rawIp;
    const userAgent = req.headers['user-agent'] || 'Unknown';

    // Parse user agent
    const parseUserAgent = (uaString) => {
      if (!uaString) return { browser: 'Unknown', device: 'Desktop' };
      const ua = uaString.toLowerCase();

      let browser = 'Other';
      if (ua.includes('edg')) browser = 'Edge';
      else if (ua.includes('chrome') && !ua.includes('chromium') && !ua.includes('opr')) browser = 'Chrome';
      else if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('chromium')) browser = 'Safari';
      else if (ua.includes('firefox')) browser = 'Firefox';
      else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

      let device = 'Desktop';
      if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';
      else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

      return { browser, device };
    };
    const { browser, device } = parseUserAgent(userAgent);

    // Parse Geolocation (Mocking based on IP last octet for richness in Recharts dashboard)
    const getCountryFromIp = (ip) => {
      if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return { country: 'United States', countryCode: 'US' };
      const parts = ip.split('.');
      const lastOctet = parseInt(parts[parts.length - 1]) || 0;
      const countries = [
        { name: 'United States', code: 'US' },
        { name: 'Germany', code: 'DE' },
        { name: 'United Kingdom', code: 'GB' },
        { name: 'India', code: 'IN' },
        { name: 'Brazil', code: 'BR' },
        { name: 'Japan', code: 'JP' }
      ];
      return countries[lastOctet % countries.length];
    };
    const { country, countryCode } = getCountryFromIp(ipAddress);

    // Determine referrer
    let referrer = req.headers['referer'] || req.headers['referrer'] || 'Direct';
    if (req.query.ref === 'qr' || req.query.source === 'qr') {
      referrer = 'QR Code';
    }

    // Extract UTM parameters
    const utmSource = req.query.utm_source || null;
    const utmMedium = req.query.utm_medium || null;
    const utmCampaign = req.query.utm_campaign || null;
    const utmContent = req.query.utm_content || null;
    const utmTerm = req.query.utm_term || null;

    await Url.updateOne({ _id: url._id }, { $inc: { clickCount: 1 } });
    
    await Visit.create({
      urlId: url._id,
      ipAddress,
      userAgent,
      browser,
      device,
      country,
      countryCode,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm
    });

    // Webhooks trigger disabled per product refocus

    res.redirect(302, url.originalUrl);
  } catch (error) {
    next(error);
  }
};

const exportUrls = async (req, res, next) => {
  try {
    const { q, filter, filename } = req.query;
    const query = { createdBy: req.user._id };

    if (q) {
      const regex = new RegExp(q, 'i');
      query.$or = [{ originalUrl: regex }, { shortCode: regex }];
    }

    const now = new Date();
    if (filter === 'active') {
      query.$or = [{ expiresAt: null }, { expiresAt: { $gt: now } }];
    } else if (filter === 'expired') {
      query.expiresAt = { $ne: null, $lte: now };
    } else if (filter === 'favorites') {
      query.isFavorite = true;
    }

    if (filter === 'archived') {
      query.isArchived = true;
    } else {
      query.isArchived = { $ne: true };
    }

    const urls = await Url.find(query).sort({ createdAt: -1 });

    const headers = ['Short Code', 'Short URL', 'Destination URL', 'Clicks', 'Status', 'Created At', 'Tags'];
    const rows = urls.map(u => {
      const isExpired = u.expiresAt && new Date(u.expiresAt) <= new Date();
      const isOverLimit = u.clickLimit !== null && u.clickCount >= u.clickLimit;
      const active = !isExpired && !isOverLimit;
      const status = active ? 'Active' : isExpired ? 'Expired' : 'Limit Exceeded';
      const shortUrl = `http://localhost:5000/r/${u.shortCode}`;

      return [
        u.shortCode,
        shortUrl,
        u.originalUrl,
        u.clickCount,
        status,
        new Date(u.createdAt).toISOString().split('T')[0],
        u.tags.join('; ')
      ];
    });

    const bom = '\ufeff';
    const csvContent = bom + [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const downloadName = filename || 'links.csv';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUrl,
  bulkCreateUrls,
  getUrls,
  searchUrls,
  getUrlById,
  updateUrl,
  deleteUrl,
  setPassword,
  verifyPassword,
  setClickLimit,
  toggleFavorite,
  getPublicStats,
  redirectUrl,
  exportUrls,
};
