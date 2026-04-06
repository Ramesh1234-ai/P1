import Analytics from "../models/Analytics.model.js";
import Stream from "../models/stream.models.js";
import mongoose from "mongoose";

/**
 * Create or update analytics for a stream
 * POST /api/analytics/create
 */
export const createAnalytics = async (req, res) => {
  try {
    const {
      streamId,
      userId,
      totalViewers,
      peakViewers,
      averageWatchTime,
      category,
      streamDate,
      streamDuration,
      engagementRate,
    } = req.body;

    // Validation
    if (!streamId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Stream ID and User ID are required",
        code: "MISSING_REQUIRED_FIELDS",
      });
    }

    // Check if analytics already exists for this stream
    const existingAnalytics = await Analytics.findOne({ streamId });

    if (existingAnalytics) {
      // Update existing record
      const updatedAnalytics = await Analytics.findByIdAndUpdate(
        existingAnalytics._id,
        {
          totalViewers: totalViewers || existingAnalytics.totalViewers,
          peakViewers: Math.max(
            peakViewers || 0,
            existingAnalytics.peakViewers
          ),
          averageWatchTime: averageWatchTime || existingAnalytics.averageWatchTime,
          engagementRate: engagementRate || existingAnalytics.engagementRate,
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Analytics updated successfully",
        analytics: updatedAnalytics,
      });
    }

    // Create new analytics record
    const newAnalytics = new Analytics({
      streamId,
      userId,
      totalViewers: totalViewers || 0,
      peakViewers: peakViewers || 0,
      averageWatchTime: averageWatchTime || 0,
      totalWatchTime: totalViewers * (averageWatchTime || 0),
      category: category || "Gaming",
      streamDate: streamDate || new Date(),
      streamDuration: streamDuration || 0,
      engagementRate: engagementRate || 0,
    });

    await newAnalytics.save();

    console.log("✅ Analytics created for stream:", streamId);

    return res.status(201).json({
      success: true,
      message: "Analytics created successfully",
      analytics: newAnalytics,
    });
  } catch (error) {
    console.error("❌ Error creating analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create analytics",
      error: error.message,
    });
  }
};

/**
 * Get detailed analytics for a specific stream
 * GET /api/analytics/stream/:streamId
 */
export const getStreamAnalytics = async (req, res) => {
  try {
    const { streamId } = req.params;

    if (!streamId || !mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream ID format",
        code: "INVALID_STREAM_ID",
      });
    }

    const analytics = await Analytics.findOne({ streamId })
      .populate("userId", "name email")
      .populate("streamId", "title category");

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: "Analytics not found for this stream",
        code: "ANALYTICS_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("❌ Error fetching stream analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch stream analytics",
      error: error.message,
    });
  }
};
/**
 * Get comprehensive analytics for a specific user
 * GET /api/analytics/user/:userId
 */
export const getUserAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        code: "INVALID_USER_ID",
      });
    }

    const userAnalytics = await Analytics.find({ userId }).sort({
      streamDate: -1,
    });

    if (userAnalytics.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No analytics found for this user",
        code: "NO_ANALYTICS",
      });
    }

    // Calculate aggregate stats
    const aggregateStats = {
      totalStreams: userAnalytics.length,
      totalViewers: userAnalytics.reduce((sum, a) => sum + a.totalViewers, 0),
      peakViewers: Math.max(...userAnalytics.map(a => a.peakViewers)),
      averageViewsPerStream: userAnalytics.reduce((sum, a) => sum + a.totalViewers, 0) /
        userAnalytics.length,
      totalWatchTime: userAnalytics.reduce((sum, a) => sum + a.totalWatchTime, 0),
      averageEngagement: userAnalytics.reduce((sum, a) => sum + a.engagementRate, 0) /
        userAnalytics.length,
      totalFollowersGained: userAnalytics.reduce((sum, a) => sum + a.followersGained, 0),
      totalChatMessages: userAnalytics.reduce((sum, a) => sum + a.chatMessages, 0),
      totalLikes: userAnalytics.reduce((sum, a) => sum + a.likes, 0),
      totalShares: userAnalytics.reduce((sum, a) => sum + a.shares, 0),
    };

    return res.status(200).json({
      success: true,
      aggregateStats,
      recentStreams: userAnalytics.slice(0, 10),
      totalRecords: userAnalytics.length,
    });
  } catch (error) {
    console.error("❌ Error fetching user analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user analytics",
      error: error.message,
    });
  }
};

/**
 * Get analytics within a date range
 * GET /api/analytics/range?userId=&startDate=&endDate=
 */
export const getAnalyticsByDateRange = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Valid user ID is required",
        code: "INVALID_USER_ID",
      });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    const end = endDate ? new Date(endDate) : new Date();

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: "Start date must be before end date",
        code: "INVALID_DATE_RANGE",
      });
    }

    const analytics = await Analytics.find({
      userId,
      streamDate: { $gte: start, $lte: end },
    }).sort({ streamDate: -1 });

    if (analytics.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No analytics found in this date range",
        code: "NO_ANALYTICS",
      });
    }

    // Calculate stats for the date range
    const rangeStats = {
      streamsInRange: analytics.length,
      totalViewersInRange: analytics.reduce((sum, a) => sum + a.totalViewers, 0),
      averageViewersPerStream:
        analytics.reduce((sum, a) => sum + a.totalViewers, 0) / analytics.length,
      peakViewersInRange: Math.max(...analytics.map(a => a.peakViewers)),
      averageEngagementInRange:
        analytics.reduce((sum, a) => sum + a.engagementRate, 0) / analytics.length,
      growthTrend: calculateGrowthTrend(analytics),
    };

    return res.status(200).json({
      success: true,
      dateRange: { start, end },
      rangeStats,
      analytics,
    });
  } catch (error) {
    console.error("❌ Error fetching analytics by date range:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics by date range",
      error: error.message,
    });
  }
};

/**
 * Generate comprehensive analytics report
 * GET /api/analytics/report/:userId
 */
export const generateAnalyticsReport = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
        code: "INVALID_USER_ID",
      });
    }

    const userAnalytics = await Analytics.find({ userId }).sort({
      streamDate: -1,
    });

    if (userAnalytics.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No analytics data available for report",
        code: "NO_DATA",
      });
    }

    // Comprehensive report generation
    const report = {
      userId,
      generatedAt: new Date(),
      summary: {
        totalStreams: userAnalytics.length,
        totalViewers: userAnalytics.reduce((sum, a) => sum + a.totalViewers, 0),
        totalWatchTime: userAnalytics.reduce((sum, a) => sum + a.totalWatchTime, 0),
        averageViewersPerStream:
          userAnalytics.reduce((sum, a) => sum + a.totalViewers, 0) /
          userAnalytics.length,
        peakViewers: Math.max(...userAnalytics.map(a => a.peakViewers)),
        averageEngagementRate:
          userAnalytics.reduce((sum, a) => sum + a.engagementRate, 0) /
          userAnalytics.length,
      },
      engagement: {
        totalFollowersGained: userAnalytics.reduce((sum, a) => sum + a.followersGained, 0),
        totalFollowersLost: userAnalytics.reduce((sum, a) => sum + a.followersLost, 0),
        netFollowersGained:
          userAnalytics.reduce((sum, a) => sum + a.followersGained, 0) -
          userAnalytics.reduce((sum, a) => sum + a.followersLost, 0),
        totalChatMessages: userAnalytics.reduce((sum, a) => sum + a.chatMessages, 0),
        totalLikes: userAnalytics.reduce((sum, a) => sum + a.likes, 0),
        totalShares: userAnalytics.reduce((sum, a) => sum + a.shares, 0),
      },
      deviceBreakdown: calculateDeviceBreakdown(userAnalytics),
      topRegions: calculateTopRegions(userAnalytics),
      categoryData: calculateCategoryData(userAnalytics),
      topPerformingStreams: userAnalytics
        .sort((a, b) => b.totalViewers - a.totalViewers)
        .slice(0, 5)
        .map(a => ({
          streamId: a.streamId,
          viewers: a.totalViewers,
          engagementRate: a.engagementRate,
          date: a.streamDate,
        })),
      trends: {
        weeklyGrowth: calculateWeeklyGrowth(userAnalytics),
        monthlyGrowth: calculateMonthlyGrowth(userAnalytics),
      },
    };

    console.log("✅ Analytics report generated for user:", userId);

    return res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    console.error("❌ Error generating analytics report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate analytics report",
      error: error.message,
    });
  }
};

/**
 * Update analytics engagement metrics
 * PUT /api/analytics/engagement/:streamId
 */
export const updateEngagementMetrics = async (req, res) => {
  try {
    const { streamId } = req.params;
    const { likes, shares, chatMessages } = req.body;

    if (!streamId || !mongoose.Types.ObjectId.isValid(streamId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stream ID format",
        code: "INVALID_STREAM_ID",
      });
    }

    const updatedAnalytics = await Analytics.findOneAndUpdate(
      { streamId },
      {
        $inc: {
          likes: likes || 0,
          shares: shares || 0,
          chatMessages: chatMessages || 0,
        },
      },
      { new: true }
    );

    if (!updatedAnalytics) {
      return res.status(404).json({
        success: false,
        message: "Analytics not found",
        code: "ANALYTICS_NOT_FOUND",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Engagement metrics updated",
      analytics: updatedAnalytics,
    });
  } catch (error) {
    console.error("❌ Error updating engagement metrics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update engagement metrics",
      error: error.message,
    });
  }
};

// ============== HELPER FUNCTIONS ==============

function calculateGrowthTrend(analytics) {
  if (analytics.length < 2) return 0;
  const recentAvg =
    analytics.slice(0, Math.ceil(analytics.length / 2)).reduce((sum, a) => sum + a.totalViewers, 0) /
    Math.ceil(analytics.length / 2);
  const earlierAvg =
    analytics.slice(Math.ceil(analytics.length / 2)).reduce((sum, a) => sum + a.totalViewers, 0) /
    Math.floor(analytics.length / 2);
  return (((recentAvg - earlierAvg) / earlierAvg) * 100).toFixed(2);
}

function calculateDeviceBreakdown(analytics) {
  const breakdown = {
    mobile: 0,
    desktop: 0,
    tablet: 0,
  };

  analytics.forEach(a => {
    breakdown.mobile += a.deviceTypes.mobile || 0;
    breakdown.desktop += a.deviceTypes.desktop || 0;
    breakdown.tablet += a.deviceTypes.tablet || 0;
  });

  return breakdown;
}

function calculateTopRegions(analytics) {
  const regions = {};

  analytics.forEach(a => {
    a.regions?.forEach(region => {
      regions[region.country] = (regions[region.country] || 0) + region.viewers;
    });
  });

  return Object.entries(regions)
    .map(([country, viewers]) => ({ country, viewers }))
    .sort((a, b) => b.viewers - a.viewers)
    .slice(0, 10);
}

function calculateCategoryData(analytics) {
  const categories = {};

  analytics.forEach(a => {
    if (a.category) {
      categories[a.category] = (categories[a.category] || 0) + a.totalViewers;
    }
  });

  return Object.entries(categories).map(([category, viewers]) => ({
    category,
    viewers,
  }));
}

function calculateWeeklyGrowth(analytics) {
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const thisWeek = analytics
    .filter(a => new Date(a.streamDate) >= weekAgo)
    .reduce((sum, a) => sum + a.totalViewers, 0);

  const lastWeek = analytics
    .filter(
      a =>
        new Date(a.streamDate) >= new Date(weekAgo - 7 * 24 * 60 * 60 * 1000) &&
        new Date(a.streamDate) < weekAgo
    )
    .reduce((sum, a) => sum + a.totalViewers, 0);

  return lastWeek > 0 ? (((thisWeek - lastWeek) / lastWeek) * 100).toFixed(2) : 0;
}

function calculateMonthlyGrowth(analytics) {
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

  const thisMonth = analytics
    .filter(a => new Date(a.streamDate) >= monthAgo)
    .reduce((sum, a) => sum + a.totalViewers, 0);

  const lastMonth = analytics
    .filter(
      a =>
        new Date(a.streamDate) >= new Date(monthAgo.getFullYear(), monthAgo.getMonth() - 1, monthAgo.getDate()) &&
        new Date(a.streamDate) < monthAgo
    )
    .reduce((sum, a) => sum + a.totalViewers, 0);

  return lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(2) : 0;
}