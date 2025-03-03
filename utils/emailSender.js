/**
 * Email Sender Utility
 * Handles sending emails using nodemailer
 */

const nodemailer = require('nodemailer');
const Template = require('../models/Template');
const Communication = require('../models/Communication');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Process template variables in content
 * @param {string} content - Email content with variables
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
 * Email sender utility
 */
const emailSender = {
  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} options.text - Email plain text content
   * @param {Array} options.attachments - Email attachments
   * @param {Object} options.metadata - Additional metadata to store
   * @param {string} options.leadId - ID of the lead this email is for
   * @param {string} options.userId - ID of the user sending the email
   * @returns {Promise} Promise resolving to the sent message info
   */
  async sendEmail(options) {
    try {
      const { to, subject, html, text, attachments, metadata, leadId, userId } = options;
      
      if (!to || (!html && !text)) {
        throw new Error('Email recipient and content are required');
      }
      
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'BDC System'}" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
        attachments
      };
      
      // Send mail with defined transport object
      const info = await transporter.sendMail(mailOptions);
      
      // Log the communication in the database if leadId is provided
      if (leadId && userId) {
        const communication = new Communication({
          lead: leadId,
          type: 'email',
          direction: 'outbound',
          subject,
          content: html || text,
          status: 'sent',
          sentAt: new Date(),
          metadata: {
            ...metadata,
            messageId: info.messageId,
            response: info.response
          },
          createdBy: userId
        });
        
        await communication.save();
      }
      
      return info;
    } catch (err) {
      console.error('Error sending email:', err);
      throw err;
    }
  },
  
  /**
   * Send an email using a template
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.templateId - ID of the template to use
   * @param {Object} options.variables - Variables to replace in the template
   * @param {Array} options.attachments - Email attachments
   * @param {Object} options.metadata - Additional metadata to store
   * @param {string} options.leadId - ID of the lead this email is for
   * @param {string} options.userId - ID of the user sending the email
   * @returns {Promise} Promise resolving to the sent message info
   */
  async sendTemplateEmail(options) {
    try {
      const { to, templateId, variables, attachments, metadata, leadId, userId } = options;
      
      if (!to || !templateId) {
        throw new Error('Email recipient and template ID are required');
      }
      
      // Get the template from the database
      const template = await Template.findById(templateId);
      
      if (!template || template.type !== 'email') {
        throw new Error('Email template not found');
      }
      
      // Process template variables
      const subject = processTemplateVariables(template.subject, variables);
      const html = processTemplateVariables(template.content, variables);
      
      // Send the email
      return this.sendEmail({
        to,
        subject,
        html,
        attachments,
        metadata: {
          ...metadata,
          templateId: template._id,
          templateName: template.name
        },
        leadId,
        userId
      });
    } catch (err) {
      console.error('Error sending template email:', err);
      throw err;
    }
  }
};

module.exports = emailSender;
