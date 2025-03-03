/**
 * SMS Sender Utility
 * Handles sending SMS messages using Twilio
 */

const twilio = require('twilio');
const Template = require('../models/Template');
const Communication = require('../models/Communication');

// Create Twilio client
const createTwilioClient = () => {
  return twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
};

/**
 * Process template variables in content
 * @param {string} content - SMS content with variables
 * @param {Object} variables - Object containing variable values
 * @returns {string} Processed content with variables replaced
 */
const processTemplateVariables = (content, variables) => {
  if (!content || !variables) return content;
  
  let processedContent = content;
  
  // Replace variables in the format {{variable_name}}
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processedContent = processedContent.replace(regex, variables[key] || '');
  });
  
  return processedContent;
};

/**
 * SMS sender utility
 */
const smsSender = {
  /**
   * Send an SMS message
   * @param {Object} options - SMS options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.body - SMS message body
   * @param {Object} options.metadata - Additional metadata to store
   * @param {string} options.leadId - ID of the lead this SMS is for
   * @param {string} options.userId - ID of the user sending the SMS
   * @returns {Promise} Promise resolving to the sent message info
   */
  async sendSMS(options) {
    try {
      const { to, body, metadata, leadId, userId } = options;
      
      if (!to || !body) {
        throw new Error('SMS recipient and body are required');
      }
      
      // Format phone number to E.164 format if not already
      const formattedPhone = to.startsWith('+') ? to : `+1${to.replace(/\D/g, '')}`;
      
      const client = createTwilioClient();
      
      // Send SMS via Twilio
      const message = await client.messages.create({
        body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      
      // Log the communication in the database if leadId is provided
      if (leadId && userId) {
        const communication = new Communication({
          lead: leadId,
          type: 'sms',
          direction: 'outbound',
          content: body,
          status: message.status,
          sentAt: new Date(),
          metadata: {
            ...metadata,
            messageId: message.sid,
            status: message.status
          },
          createdBy: userId
        });
        
        await communication.save();
      }
      
      return message;
    } catch (err) {
      console.error('Error sending SMS:', err);
      throw err;
    }
  },
  
  /**
   * Send an SMS using a template
   * @param {Object} options - SMS options
   * @param {string} options.to - Recipient phone number
   * @param {string} options.templateId - ID of the template to use
   * @param {Object} options.variables - Variables to replace in the template
   * @param {Object} options.metadata - Additional metadata to store
   * @param {string} options.leadId - ID of the lead this SMS is for
   * @param {string} options.userId - ID of the user sending the SMS
   * @returns {Promise} Promise resolving to the sent message info
   */
  async sendTemplateSMS(options) {
    try {
      const { to, templateId, variables, metadata, leadId, userId } = options;
      
      if (!to || !templateId) {
        throw new Error('SMS recipient and template ID are required');
      }
      
      // Get the template from the database
      const template = await Template.findById(templateId);
      
      if (!template || template.type !== 'sms') {
        throw new Error('SMS template not found');
      }
      
      // Process template variables
      const body = processTemplateVariables(template.content, variables);
      
      // Send the SMS
      return this.sendSMS({
        to,
        body,
        metadata: {
          ...metadata,
          templateId: template._id,
          templateName: template.name
        },
        leadId,
        userId
      });
    } catch (err) {
      console.error('Error sending template SMS:', err);
      throw err;
    }
  },
  
  /**
   * Handle incoming SMS webhook from Twilio
   * @param {Object} body - Twilio webhook request body
   * @returns {Promise} Promise resolving to the saved communication
   */
  async handleIncomingSMS(body) {
    try {
      // Extract relevant information from Twilio webhook
      const {
        From: from,
        Body: content,
        MessageSid: messageId,
        SmsStatus: status
      } = body;
      
      // Try to find a lead with this phone number
      const Lead = require('../models/Lead');
      const lead = await Lead.findOne({
        phone: from.replace(/^\+1/, '') // Remove +1 country code if present
      });
      
      if (!lead) {
        console.log(`Received SMS from unknown number: ${from}`);
        return null;
      }
      
      // Log the communication
      const communication = new Communication({
        lead: lead._id,
        type: 'sms',
        direction: 'inbound',
        content,
        status: 'received',
        sentAt: new Date(),
        metadata: {
          messageId,
          status,
          from
        },
        // Use system user ID for inbound messages
        createdBy: process.env.SYSTEM_USER_ID || '000000000000000000000000'
      });
      
      await communication.save();
      
      // Notify relevant users about the new message
      const socketManager = require('./socketManager');
      
      if (lead.assignedTo) {
        socketManager.sendNotification(lead.assignedTo.toString(), {
          type: 'communication',
          title: 'New SMS Message',
          message: `New message from ${lead.firstName} ${lead.lastName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          link: `/leads/${lead._id}`,
          relatedTo: {
            model: 'lead',
            id: lead._id
          }
        });
      }
      
      return communication;
    } catch (err) {
      console.error('Error handling incoming SMS:', err);
      throw err;
    }
  }
};

module.exports = smsSender;
