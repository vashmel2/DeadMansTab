import emailjs from 'emailjs-com';
import { EmailFormData } from '../types';
import { logClick } from '../api/clickStore';

// EmailJS configuration
const SERVICE_ID = 'service_aeih9as';
const TEMPLATE_ID = 'template_jwgjuxe';
const USER_ID = 'dnos_nCVrmOTXdLKu';

// Get the base URL for the API
const BASE_URL = import.meta.env.PROD 
  ? 'https://your-production-domain.com' // Replace with your actual production domain
  : window.location.origin;

export const sendEmail = async (data: EmailFormData): Promise<void> => {
  // Generate a unique userId for tracking
  const userId = data.recipientEmail; // Using email as userId for simplicity
  
  // Create a trackable link that points to our API endpoint
  const trackingEndpoint = `${BASE_URL}/api/trackLinkVisit?userId=${userId}`;
  
  // Format the message to include the trackable link
  const formattedMessage = `${data.message}\n\nHere's your link: ${data.linkText}`;
  
  const templateParams = {
    to_email: data.recipientEmail,
    subject: data.subject,
    message: formattedMessage,
    link_url: data.linkUrl, // Original destination URL
    link_text: data.linkText,
    tracking_url: trackingEndpoint // Add tracking URL as separate parameter
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, USER_ID);
    
    // Log the initial email send using the correct function
    await logClick({ 
      userId, 
      timestamp: new Date().toISOString(), 
      ip: 'email_service' 
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
};