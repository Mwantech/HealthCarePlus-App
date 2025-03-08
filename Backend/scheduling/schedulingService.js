// schedulingService.js
const nodemailer = require('nodemailer');

class SchedulingService {
  constructor(connection) {
    this.connection = connection;
    this.MINIMUM_BREAK_MINUTES = 15;
    this.MAX_DAILY_APPOINTMENTS = 8;
    this.emailTransporter = nodemailer.createTransport({
      // Configure your email service
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async optimizeSchedule(doctorId, date) {
    const appointments = await this.fetchDoctorAppointments(doctorId, date);
    
    // Sort appointments chronologically
    appointments.sort((a, b) => {
      const timeA = new Date(`${a.appointment_date}T${a.appointment_time}`);
      const timeB = new Date(`${b.appointment_date}T${b.appointment_time}`);
      return timeA - timeB;
    });

    const conflicts = this.detectConflicts(appointments);
    const schedulingChanges = [];

    // Handle conflicts and enforce breaks
    if (conflicts.length > 0) {
      for (const conflict of conflicts) {
        const newSlot = await this.findNextAvailableSlot(doctorId, conflict.appointment);
        schedulingChanges.push({
          appointmentId: conflict.appointment.id,
          oldTime: conflict.appointment.appointment_time,
          oldDate: conflict.appointment.appointment_date,
          newTime: newSlot.time,
          newDate: newSlot.date,
          reason: 'conflict'
        });
      }
    }

    // Enforce breaks between appointments
    const breaksNeeded = this.identifyMissingBreaks(appointments);
    for (const breakSlot of breaksNeeded) {
      const newSlot = await this.findNextAvailableSlot(doctorId, breakSlot.appointment);
      schedulingChanges.push({
        appointmentId: breakSlot.appointment.id,
        oldTime: breakSlot.appointment.appointment_time,
        oldDate: breakSlot.appointment.appointment_date,
        newTime: newSlot.time,
        newDate: newSlot.date,
        reason: 'break'
      });
    }

    // Handle overbooked days
    if (appointments.length > this.MAX_DAILY_APPOINTMENTS) {
      const changes = await this.redistributeOddAppointments(doctorId, appointments);
      schedulingChanges.push(...changes);
    }

    // Apply all scheduling changes
    await this.applySchedulingChanges(schedulingChanges);

    // Notify affected patients
    await this.notifyPatients(schedulingChanges);

    return schedulingChanges;
  }

  detectConflicts(appointments) {
    const conflicts = [];
    for (let i = 0; i < appointments.length - 1; i++) {
      const current = appointments[i];
      const next = appointments[i + 1];
      
      const currentEnd = this.addMinutesToTime(current.appointment_time, 30);
      if (this.isTimeOverlapping(currentEnd, next.appointment_time)) {
        conflicts.push({
          appointment: next,
          type: 'overlap'
        });
      }
    }
    return conflicts;
  }

  identifyMissingBreaks(appointments) {
    const breaksNeeded = [];
    for (let i = 0; i < appointments.length - 1; i++) {
      const current = appointments[i];
      const next = appointments[i + 1];
      
      const currentEnd = this.addMinutesToTime(current.appointment_time, 30);
      const breakMinutes = this.getMinutesBetweenTimes(currentEnd, next.appointment_time);
      
      if (breakMinutes < this.MINIMUM_BREAK_MINUTES) {
        breaksNeeded.push({
          appointment: next,
          requiredBreak: this.MINIMUM_BREAK_MINUTES - breakMinutes
        });
      }
    }
    return breaksNeeded;
  }

  async redistributeOddAppointments(doctorId, appointments) {
    const changes = [];
    const oddNumberedAppointments = appointments.filter((_, index) => index % 2 === 0);
    
    for (const appointment of oddNumberedAppointments) {
      const nextAvailableDay = await this.findNextAvailableDay(doctorId, appointment.appointment_date);
      if (nextAvailableDay) {
        changes.push({
          appointmentId: appointment.id,
          oldDate: appointment.appointment_date,
          oldTime: appointment.appointment_time,
          newDate: nextAvailableDay.date,
          newTime: nextAvailableDay.time,
          reason: 'redistribution'
        });
      }
    }
    
    return changes;
  }

  async findNextAvailableSlot(doctorId, appointment) {
    const [rows] = await this.connection.promise().query(
      `SELECT appointment_date, appointment_time 
       FROM appointments 
       WHERE doctor_id = ? 
       AND (appointment_date > ? OR (appointment_date = ? AND appointment_time > ?))
       ORDER BY appointment_date, appointment_time`,
      [doctorId, appointment.appointment_date, appointment.appointment_date, appointment.appointment_time]
    );

    // Find first available 30-minute slot with proper breaks
    let currentDate = new Date(appointment.appointment_date);
    let currentTime = '09:00'; // Start of day

    while (true) {
      const existingAppointment = rows.find(a => 
        a.appointment_date.toISOString().split('T')[0] === currentDate.toISOString().split('T')[0] &&
        this.isTimeOverlapping(currentTime, a.appointment_time)
      );

      if (!existingAppointment) {
        return {
          date: currentDate.toISOString().split('T')[0],
          time: currentTime
        };
      }

      currentTime = this.addMinutesToTime(currentTime, 45); // 30min appointment + 15min break
      if (currentTime >= '17:00') { // End of day
        currentDate.setDate(currentDate.getDate() + 1);
        currentTime = '09:00';
      }
    }
  }

  async notifyPatients(changes) {
    for (const change of changes) {
      const [patientInfo] = await this.connection.promise().query(
        'SELECT patient_name, user_email FROM appointments WHERE id = ?',
        [change.appointmentId]
      );

      if (patientInfo.length > 0) {
        const emailContent = this.generateEmailContent(patientInfo[0], change);
        await this.sendEmail(patientInfo[0].user_email, emailContent);
      }
    }
  }

  generateEmailContent(patient, change) {
    const reasonText = {
      'conflict': 'scheduling conflict',
      'break': 'required break time',
      'redistribution': 'optimizing daily schedule'
    }[change.reason];

    return {
      subject: 'Your Appointment Has Been Rescheduled',
      text: `Dear ${patient.patient_name},

Due to a ${reasonText}, your appointment has been rescheduled:

Original: ${change.oldDate} at ${change.oldTime}
New: ${change.newDate} at ${change.newTime}

Please confirm this new appointment time by clicking the link below:
[Confirmation Link]

If this time doesn't work for you, please use our online booking system to choose a different time.

We apologize for any inconvenience.

Best regards,
Medical Center Team`
    };
  }

  async sendEmail(to, content) {
    try {
      await this.emailTransporter.sendMail({
        from: 'scheduling@medical-center.com',
        to,
        subject: content.subject,
        text: content.text
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      // Log failed notifications for manual follow-up
    }
  }

  // Utility functions
  isTimeOverlapping(time1, time2) {
    return new Date(`2000-01-01T${time1}`) >= new Date(`2000-01-01T${time2}`);
  }

  addMinutesToTime(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date(2000, 0, 1, hours, mins + minutes);
    return date.toTimeString().slice(0, 5);
  }

  getMinutesBetweenTimes(time1, time2) {
    const date1 = new Date(`2000-01-01T${time1}`);
    const date2 = new Date(`2000-01-01T${time2}`);
    return Math.floor((date2 - date1) / (1000 * 60));
  }
}

module.exports = SchedulingService;