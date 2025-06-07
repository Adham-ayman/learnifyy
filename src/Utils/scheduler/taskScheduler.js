import cron from 'node-cron';
import { taskModel } from '../../DB/models/task.model.js';
import { emailevent } from '../events/email.event.js';


cron.schedule('0 0 * * *', async () => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const endOfTomorrow = new Date(tomorrow);
    endOfTomorrow.setHours(23, 59, 59, 999);

    const tasksToNotify = await taskModel.find({
      dueDate: { $gte: tomorrow, $lte: endOfTomorrow },
      status: { $ne: 'completed' },
      reminderSent: { $ne: true }
    }).populate('user').lean();

    if (tasksToNotify.length === 0) {
      console.log('No tasks to notify for tomorrow.');
      return;
    }

    for (const task of tasksToNotify) {
      const { user, title, dueDate } = task;
      if (user && user.email) {
        const html = `
          <h2>Task Reminder: ${title}</h2>
          <p>Your task is due tomorrow: ${new Date(dueDate).toLocaleDateString()}</p>
          <p>Don't forget to complete it!</p>
          <p>— Learnify Team</p>
        `;

        emailevent.emit('TaskReminder', {
          email: user.email,
          subject: 'Task Due Tomorrow Reminder',
          html
        });

        console.log(`Reminder sent to ${user.email} for task: ${title}`);

        // Mark reminder as sent
        await taskModel.findByIdAndUpdate(task._id, { reminderSent: true });
      } else {
        console.log('User email not found for task:', title);
      }
    }
  } catch (error) {
    console.error('Error sending task reminders:', error);
  }
});




