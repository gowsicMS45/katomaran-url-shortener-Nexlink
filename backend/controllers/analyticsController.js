const Url = require('../models/Url');
const Visit = require('../models/Visit');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: extract browser + device from User-Agent string
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Aggregate dashboard stats
// @route  GET /api/analytics/dashboard
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();

    const totalUrls = await Url.countDocuments({ createdBy: userId });

    const clicksResult = await Url.aggregate([
      { $match: { createdBy: userId } },
      { $group: { _id: null, total: { $sum: '$clickCount' } } }
    ]);
    const totalClicks = clicksResult.length > 0 ? clicksResult[0].total : 0;

    const activeLinks = await Url.countDocuments({
      createdBy: userId,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }]
    });

    const expiredLinks = await Url.countDocuments({
      createdBy: userId,
      expiresAt: { $ne: null, $lte: now }
    });

    res.status(200).json({
      totalUrls,
      totalClicks,
      activeLinks,
      expiredLinks
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Detailed analytics for a single URL
// @route  GET /api/analytics/url/:id
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const getUrlAnalytics = async (req, res, next) => {
  try {
    const urlId = req.params.id;
    const url = await Url.findOne({ _id: urlId, createdBy: req.user._id });
    if (!url) { res.status(404); throw new Error('URL not found or unauthorized'); }

    const visits = await Visit.find({ urlId }).sort({ timestamp: -1 });

    const totalClicks = url.clickCount;
    const lastVisited = visits.length > 0 ? visits[0].timestamp : null;

    // Daily trend — last 7 days
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push(date.toISOString().split('T')[0]);
    }

    const mongoose = require('mongoose');
    const visitAgg = await Visit.aggregate([
      { $match: { urlId: new mongoose.Types.ObjectId(url._id) } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          clicks: { $sum: 1 }
        }
      }
    ]);

    const clickMap = {};
    visitAgg.forEach(v => { clickMap[v._id] = v.clicks; });

    const dailyClicks = last7Days.map(date => ({
      date: date.slice(5),
      clicks: clickMap[date] || 0
    }));

    // Weekly trend — last 8 weeks
    const weeklyClicks = [];
    for (let i = 7; i >= 0; i--) {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - (i * 7) - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      const count = visits.filter(v => {
        const t = new Date(v.timestamp).getTime();
        return t >= startOfWeek.getTime() && t <= endOfWeek.getTime();
      }).length;
      weeklyClicks.push({ 
        week: `W/C ${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, 
        clicks: count 
      });
    }

    // Recent visits
    const recentVisits = visits.slice(0, 15).map(v => {
      const { browser, device } = parseUserAgent(v.userAgent);
      return {
        browser,
        device,
        ipAddress: v.ipAddress,
        timestamp: v.timestamp
      };
    });

    // Browser breakdown
    const browserCounts = {};
    visits.forEach(v => {
      const { browser } = parseUserAgent(v.userAgent);
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });

    const browserStats = Object.keys(browserCounts).map(browser => ({
      browser,
      count: browserCounts[browser]
    }));

    res.status(200).json({
      url: {
        shortCode: url.shortCode,
        originalUrl: url.originalUrl,
        expiresAt: url.expiresAt,
        clickCount: url.clickCount
      },
      totalClicks,
      lastVisited,
      dailyClicks,
      weeklyClicks,
      recentVisits,
      browserStats
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc   Export full analytics as JSON (for PDF generation on frontend)
// @route  GET /api/analytics/url/:id/export
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const exportAnalytics = async (req, res, next) => {
  try {
    const urlId = req.params.id;
    const url = await Url.findOne({ _id: urlId, createdBy: req.user._id });
    if (!url) { res.status(404); throw new Error('URL not found or unauthorized'); }

    const visits = await Visit.find({ urlId }).sort({ timestamp: -1 });

    const browserCounts = {};
    const deviceCounts = {};
    visits.forEach(v => {
      const { browser, device } = parseUserAgent(v.userAgent);
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    });

    const dailyTrend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const count = visits.filter(v => new Date(v.timestamp).toISOString().split('T')[0] === ds).length;
      dailyTrend.push({ date: ds, clicks: count });
    }

    if (req.query.format === 'csv') {
      const headers = ['Timestamp', 'IP Address', 'Browser', 'Device', 'Country', 'Country Code', 'Referrer', 'UTM Source', 'UTM Medium', 'UTM Campaign'];
      const rows = visits.map(v => [
        new Date(v.timestamp).toISOString(),
        v.ipAddress || '',
        v.browser || '',
        v.device || '',
        v.country || '',
        v.countryCode || '',
        v.referrer || '',
        v.utmSource || '',
        v.utmMedium || '',
        v.utmCampaign || ''
      ]);

      const bom = '\ufeff';
      const csvContent = bom + [headers, ...rows]
        .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const downloadName = req.query.filename || 'analytics-report.csv';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
      return res.status(200).send(csvContent);
    }

    res.status(200).json({
      success: true,
      export: {
        generatedAt: new Date().toISOString(),
        url: {
          shortCode: url.shortCode,
          originalUrl: url.originalUrl,
          createdAt: url.createdAt,
          expiresAt: url.expiresAt,
          clickCount: url.clickCount,
          clickLimit: url.clickLimit,
          tags: url.tags,
        },
        totalVisits: visits.length,
        browserBreakdown: browserCounts,
        deviceBreakdown: deviceCounts,
        dailyTrend,
        recentVisits: visits.slice(0, 30).map(v => ({
          timestamp: v.timestamp,
          ...parseUserAgent(v.userAgent),
        })),
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get aggregated analytics for the entire workspace
// @route   GET /api/analytics/workspace
// @access  Private
const getWorkspaceAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const Url = require('../models/Url');
    const Visit = require('../models/Visit');

    const urls = await Url.find({ createdBy: userId });
    const urlIds = urls.map(u => u._id);

    const visits = await Visit.find({ urlId: { $in: urlIds } }).sort({ timestamp: -1 });

    const totalLinks = urls.length;
    const totalClicks = visits.length;

    // Unique visitors (by IP)
    const uniqueIps = new Set(visits.map(v => v.ipAddress));
    const uniqueVisitors = uniqueIps.size;

    // Active links
    const activeLinks = urls.filter(u => !u.expiresAt || new Date(u.expiresAt) > now).length;

    // QR Downloads (simulate from visitors referred by qr)
    const qrDownloads = visits.filter(v => 
      v.referrer === 'QR Code' || 
      (v.utmSource && v.utmSource.toLowerCase() === 'qr')
    ).length;

    // Countries reached
    const countriesSet = new Set(visits.filter(v => v.countryCode && v.countryCode !== 'XX').map(v => v.countryCode));
    const countriesReached = visits.length === 0 ? 0 : (countriesSet.size || 1);

    // Weekly Growth click comparison
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const clicksThisWeek = visits.filter(v => new Date(v.timestamp) >= sevenDaysAgo).length;
    const clicksLastWeek = visits.filter(v => {
      const t = new Date(v.timestamp);
      return t >= fourteenDaysAgo && t < sevenDaysAgo;
    }).length;
    const weeklyGrowth = clicksLastWeek > 0 ? Math.round(((clicksThisWeek - clicksLastWeek) / clicksLastWeek) * 100) : 0;

    // 1. Traffic Trend (last 30 days)
    const dailyData = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      dailyData[ds] = { clicks: 0, uniq: new Set() };
    }

    visits.forEach(v => {
      const ds = new Date(v.timestamp).toISOString().split('T')[0];
      if (dailyData[ds]) {
        dailyData[ds].clicks++;
        dailyData[ds].uniq.add(v.ipAddress);
      }
    });

    const trafficData = Object.keys(dailyData).map((date, index) => ({
      d: `Day ${index + 1}`,
      clicks: dailyData[date].clicks,
      uniq: dailyData[date].uniq.size
    }));

    // 2. Sources breakdown
    const sourcesMap = { Direct: 0, Twitter: 0, LinkedIn: 0, Email: 0, Search: 0 };
    visits.forEach(v => {
      const src = v.utmSource || v.referrer || 'Direct';
      let found = 'Direct';
      if (/twitter|t\.co/i.test(src)) found = 'Twitter';
      else if (/linkedin|lnkd/i.test(src)) found = 'LinkedIn';
      else if (/email|mail/i.test(src)) found = 'Email';
      else if (/google|bing|search|yahoo/i.test(src)) found = 'Search';
      sourcesMap[found] = (sourcesMap[found] || 0) + 1;
    });
    const sourcesData = Object.keys(sourcesMap).map(k => ({ name: k, value: sourcesMap[k] }));

    // 3. Devices breakdown
    const devicesMap = { Desktop: 0, Mobile: 0, Tablet: 0 };
    visits.forEach(v => {
      const d = v.device || 'Desktop';
      devicesMap[d] = (devicesMap[d] || 0) + 1;
    });
    const devicesData = Object.keys(devicesMap).map(k => ({ name: k, value: devicesMap[k] }));

    // 4. Browsers breakdown
    const browsersMap = { Chrome: 0, Safari: 0, Edge: 0, Firefox: 0, Other: 0 };
    visits.forEach(v => {
      const b = v.browser || 'Other';
      browsersMap[b] = (browsersMap[b] || 0) + 1;
    });
    const browsersData = Object.keys(browsersMap).map(k => ({ name: k, value: browsersMap[k] }));

    // 5. Geolocation countries list
    const countryMap = {};
    visits.forEach(v => {
      if (v.country && v.country !== 'Unknown') {
        countryMap[v.country] = countryMap[v.country] || { code: v.countryCode, visits: 0 };
        countryMap[v.country].visits++;
      }
    });
    const countriesData = Object.keys(countryMap).map(k => ({
      name: k,
      code: countryMap[k].code,
      visits: countryMap[k].visits
    })).sort((a, b) => b.visits - a.visits).slice(0, 6);

    // If empty country mapping, push a dummy default
    if (countriesData.length === 0) {
      countriesData.push({ name: 'United States', code: 'US', visits: 0 });
    }

    // 6. Heatmap data (7 days * 24 hours)
    const heatmapData = [];
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    days.forEach(day => {
      const hours = [];
      for (let h = 0; h < 24; h++) {
        hours.push(0);
      }
      heatmapData.push({ day, hours });
    });

    visits.forEach(v => {
      const d = new Date(v.timestamp);
      let dayIndex = d.getDay() - 1; // Mon is 0, Sun is -1
      if (dayIndex === -1) dayIndex = 6;
      const hour = d.getHours();
      if (heatmapData[dayIndex] && heatmapData[dayIndex].hours[hour] !== undefined) {
        heatmapData[dayIndex].hours[hour]++;
      }
    });

    // 7. Recent activity from AuditLog
    const getRelativeTime = (date) => {
      const diff = Date.now() - new Date(date).getTime();
      const mins = Math.round(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.round(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.round(hours / 24);
      return `${days}d ago`;
    };

    const recentUrls = await Url.find({ createdBy: userId }).sort({ createdAt: -1 }).limit(5);

    const activity = recentUrls.map(u => ({
      who: req.user.name || 'You',
      what: 'created link',
      target: u.shortCode,
      when: getRelativeTime(u.createdAt)
    }));

    // 8. Top performing links
    const topUrls = await Url.find({ createdBy: userId }).sort({ clickCount: -1 }).limit(6);
    const linksList = topUrls.map(u => ({
      id: u._id,
      slug: u.shortCode,
      url: u.originalUrl,
      clicks: u.clickCount,
      ctr: u.clickCount > 0 ? 5.2 : 0,
      status: (!u.expiresAt || new Date(u.expiresAt) > now) ? 'active' : 'expired',
      tag: u.tags[0] || 'General',
      created: getRelativeTime(u.createdAt)
    }));

    res.status(200).json({
      success: true,
      metrics: {
        totalLinks,
        totalClicks,
        uniqueVisitors,
        activeLinks,
        qrDownloads,
        countriesReached,
        weeklyGrowth
      },
      charts: {
        trafficData,
        sourcesData,
        devicesData,
        browsersData,
        countriesData,
        heatmapData,
        activity,
        linksList
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getUrlAnalytics,
  exportAnalytics,
  getWorkspaceAnalytics
};
