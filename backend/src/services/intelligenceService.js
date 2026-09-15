const axios = require('axios');
const prisma = require('../utils/prisma');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function triggerIntelligenceAnalysis(eventId, contextType, data) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/intelligence/analyze`, {
      event_id: eventId,
      context_type: contextType,
      data: data
    });

    const analysis = response.data?.analysis;
    if (!analysis) return null;

    const { insight, recommendation } = analysis;

    // Save Insight
    const createdInsight = await prisma.eventInsight.create({
      data: {
        eventId,
        type: insight.type,
        description: insight.description,
        severity: insight.severity
      }
    });

    // Save Recommendation if exists
    if (recommendation) {
      await prisma.actionableRecommendation.create({
        data: {
          eventId,
          insightId: createdInsight.id,
          message: recommendation.message,
          sourceAgent: recommendation.sourceAgent
        }
      });
    }

    return createdInsight;
  } catch (error) {
    console.error(`[IntelligenceService] Error analyzing event ${eventId}:`, error.message);
    return null;
  }
}

module.exports = {
  triggerIntelligenceAnalysis
};
