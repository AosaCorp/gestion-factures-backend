const { Op } = require('sequelize');
const { Invoice, Client, Reminder, Company } = require('../models');
const { sendInvoiceEmail } = require('./emailService');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

// Configuration des délais de rappel (en jours)
const REMINDER_CONFIG = {
  first: 3,   // 3 jours après échéance
  second: 7,  // 7 jours après échéance
  third: 14,  // 14 jours après échéance
  final: 30   // 30 jours après échéance
};

// Traductions des types de rappel
const REMINDER_TYPES = {
  first: 'Premier rappel',
  second: 'Deuxième rappel',
  third: 'Troisième rappel',
  final: 'Dernier rappel avant action'
};

// Modèles d'emails de rappel
const getReminderEmailContent = (client, invoice, reminderType, company) => {
  const companyName = company?.name || 'Notre association';
  const reminderText = REMINDER_TYPES[reminderType] || 'Rappel de paiement';
  
  let message = '';
  switch (reminderType) {
    case 'first':
      message = `Nous vous rappelons que votre facture ${invoice.number} arrive à échéance. Merci de bien vouloir procéder à son règlement dans les meilleurs délais.`;
      break;
    case 'second':
      message = `Votre facture ${invoice.number} est en retard de paiement. Nous vous remercions de bien vouloir régulariser votre situation rapidement.`;
      break;
    case 'third':
      message = `Malgré nos précédents rappels, votre facture ${invoice.number} reste impayée. Nous vous demandons de bien vouloir procéder au règlement sous 7 jours.`;
      break;
    case 'final':
      message = `DERNIER RAPPEL : Votre facture ${invoice.number} est toujours impayée. Passé ce délai, des frais supplémentaires pourront être appliqués.`;
      break;
    default:
      message = `Votre facture ${invoice.number} est en attente de paiement.`;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${reminderText} - Facture ${invoice.number}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #ef4444; padding-bottom: 15px; margin-bottom: 20px; }
        .header h1 { color: #ef4444; margin: 0; }
        .content { margin-bottom: 30px; }
        .invoice-details { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
        .invoice-details table { width: 100%; }
        .invoice-details td { padding: 5px 0; }
        .total { font-size: 18px; font-weight: bold; color: #ef4444; }
        .warning { color: #ef4444; font-weight: bold; }
        .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${reminderText}</h1>
          <p>${companyName}</p>
        </div>
        <div class="content">
          <p>Bonjour <strong>${client.name}</strong>,</p>
          <p>${message}</p>
          <div class="invoice-details">
            </table>
              <tr><td><strong>N° Facture:</strong></td><td>${invoice.number}</td></tr>
              <tr><td><strong>Date d'émission:</strong></td><td>${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</td></tr>
              <tr><td><strong>Montant dû:</strong></td><td class="total">${invoice.total.toLocaleString()} FCFA</td></tr>
            </table>
          </div>
          <p>Pour toute question, n'hésitez pas à nous contacter.</p>
          <p class="warning">Ceci est un rappel automatique, merci de ne pas y répondre.</p>
        </div>
        <div class="footer">
          <p>${companyName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return { subject: `${reminderText} - Facture ${invoice.number}`, html };
};

/**
 * Vérifie les factures impayées et crée des rappels si nécessaire
 */
const checkAndCreateReminders = async () => {
  try {
    const unpaidInvoices = await Invoice.findAll({
      where: { 
        status: 'draft',
        paidAt: null
      },
      include: [{ model: Client, as: 'client' }]
    });
    
    const today = new Date();
    const remindersCreated = [];
    
    for (const invoice of unpaidInvoices) {
      const invoiceDate = new Date(invoice.createdAt);
      const daysOverdue = Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));
      
      const existingReminders = await Reminder.findAll({
        where: { invoiceId: invoice.id }
      });
      
      const existingTypes = existingReminders.map(r => r.reminderType);
      
      let reminderType = null;
      if (daysOverdue >= REMINDER_CONFIG.final && !existingTypes.includes('final')) {
        reminderType = 'final';
      } else if (daysOverdue >= REMINDER_CONFIG.third && !existingTypes.includes('third')) {
        reminderType = 'third';
      } else if (daysOverdue >= REMINDER_CONFIG.second && !existingTypes.includes('second')) {
        reminderType = 'second';
      } else if (daysOverdue >= REMINDER_CONFIG.first && !existingTypes.includes('first')) {
        reminderType = 'first';
      }
      
      if (reminderType && invoice.client && invoice.client.email) {
        const reminder = await Reminder.create({
          invoiceId: invoice.id,
          reminderType: reminderType,
          status: 'pending',
          scheduledDate: new Date()
        });
        remindersCreated.push(reminder);
        console.log(`📝 Rappel ${reminderType} créé pour facture ${invoice.number}`);
      }
    }
    
    return remindersCreated;
  } catch (error) {
    console.error('Erreur création rappels:', error);
    return [];
  }
};

/**
 * Envoie les rappels en attente
 */
const sendPendingReminders = async () => {
  try {
    const pendingReminders = await Reminder.findAll({
      where: { 
        status: 'pending',
        scheduledDate: { [Op.lte]: new Date() }
      },
      include: [
        { model: Invoice, as: 'invoice', include: [{ model: Client, as: 'client' }] }
      ]
    });
    
    const company = await Company.findOne();
    const results = [];
    
    for (const reminder of pendingReminders) {
      try {
        const invoice = reminder.invoice;
        const client = invoice.client;
        
        if (!client || !client.email) {
          reminder.status = 'failed';
          reminder.errorMessage = 'Client sans email';
          await reminder.save();
          continue;
        }
        
        const pdfBuffer = await generateInvoicePDF(
          invoice, 
          client, 
          invoice.items || [], 
          invoice.Payments || [], 
          company
        );
        
        const { subject, html } = getReminderEmailContent(client, invoice, reminder.reminderType, company);
        
        const emailResult = await sendInvoiceEmail(
          { ...invoice.toJSON(), subject, html },
          client,
          pdfBuffer,
          company
        );
        
        reminder.status = 'sent';
        reminder.sentDate = new Date();
        await reminder.save();
        
        results.push({ success: true, reminder });
        console.log(`✅ Rappel ${reminder.reminderType} envoyé pour facture ${invoice.number}`);
        
      } catch (error) {
        console.error(`❌ Erreur envoi rappel ${reminder.id}:`, error.message);
        reminder.status = 'failed';
        reminder.errorMessage = error.message;
        await reminder.save();
        results.push({ success: false, reminder, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Erreur envoi rappels:', error);
    return [];
  }
};

/**
 * Obtient les statistiques des rappels
 */
const getReminderStats = async () => {
  try {
    const total = await Reminder.count();
    const sent = await Reminder.count({ where: { status: 'sent' } });
    const pending = await Reminder.count({ where: { status: 'pending' } });
    const failed = await Reminder.count({ where: { status: 'failed' } });
    
    const byType = {
      first: await Reminder.count({ where: { reminderType: 'first' } }),
      second: await Reminder.count({ where: { reminderType: 'second' } }),
      third: await Reminder.count({ where: { reminderType: 'third' } }),
      final: await Reminder.count({ where: { reminderType: 'final' } })
    };
    
    return { total, sent, pending, failed, byType };
  } catch (error) {
    console.error('Erreur stats rappels:', error);
    return { total: 0, sent: 0, pending: 0, failed: 0, byType: { first: 0, second: 0, third: 0, final: 0 } };
  }
};

module.exports = {
  checkAndCreateReminders,
  sendPendingReminders,
  getReminderStats,
  REMINDER_CONFIG
};