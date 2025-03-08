// schedulingRoutes.js
const express = require('express');
const router = express.Router();
const SchedulingService = require('../scheduling/schedulingService');

module.exports = (connection) => {
  const schedulingService = new SchedulingService(connection);

  // Optimize schedule for a specific doctor and date
  router.post('/optimize/:doctorId', async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.body;

    try {
      const changes = await schedulingService.optimizeSchedule(doctorId, date);
      res.json({
        success: true,
        changes,
        message: `Schedule optimized with ${changes.length} changes`
      });
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to optimize schedule',
        details: error.message
      });
    }
  });

  // Endpoint to manually trigger break enforcement
  router.post('/enforce-breaks/:doctorId', async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.body;

    try {
      const appointments = await schedulingService.fetchDoctorAppointments(doctorId, date);
      const breaksNeeded = schedulingService.identifyMissingBreaks(appointments);
      const changes = [];

      for (const breakSlot of breaksNeeded) {
        const newSlot = await schedulingService.findNextAvailableSlot(
          doctorId,
          breakSlot.appointment
        );
        changes.push({
          appointmentId: breakSlot.appointment.id,
          oldTime: breakSlot.appointment.appointment_time,
          oldDate: breakSlot.appointment.appointment_date,
          newTime: newSlot.time,
          newDate: newSlot.date,
          reason: 'break'
        });
      }

      if (changes.length > 0) {
        await schedulingService.applySchedulingChanges(changes);
        await schedulingService.notifyPatients(changes);
      }

      res.json({
        success: true,
        changes,
        message: `Enforced breaks with ${changes.length} schedule adjustments`
      });
    } catch (error) {
      console.error('Error enforcing breaks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to enforce breaks',
        details: error.message
      });
    }
  });

  return router;
};