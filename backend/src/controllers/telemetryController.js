const axios = require('axios');

const ingestTelemetry = async (req, res) => {
  try {
    const telemetryData = req.body;
    // Example: { hallId: "Hall B", currentCapacity: 85, entryRateIncrease: 30 }

    // Log the incoming data
    console.log("Received telemetry data:", telemetryData);

    // In a real scenario, this would be pushed to a time-series DB or Kafka
    // For now, we will forward it to the AI service to check for predictive alerts

    try {
      // Assuming AI service runs on port 8000
      const aiResponse = await axios.post('http://127.0.0.1:8000/api/incident-agent/predict', telemetryData);
      
      // If AI detects a predictive issue, we can dispatch it
      if (aiResponse.data && aiResponse.data.alert) {
         const NotificationService = require('../services/NotificationService');
         await NotificationService.dispatch({
            type: 'High',
            message: `[PREDICTIVE ALERT] ${aiResponse.data.alert}`,
            context: telemetryData
         });
      }
    } catch (aiError) {
      console.error("Failed to forward telemetry to AI service", aiError.message);
    }

    res.status(202).json({ status: 'Telemetry ingested' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to ingest telemetry' });
  }
};

module.exports = { ingestTelemetry };
