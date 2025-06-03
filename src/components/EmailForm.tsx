import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Link as LinkIcon, Send, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EmailFormData, EmailStatus } from '../types';
import { sendEmail } from '../services/emailService';

const EmailForm: React.FC = () => {
  const [status, setStatus] = useState<EmailStatus>('idle');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    watch,
    reset
  } = useForm<EmailFormData>({
    defaultValues: {
      subject: '',
      recipientEmail: '',
      message: '',
      linkUrl: '',
      linkText: 'Click here'
    }
  });
  
  const formValues = watch();
  
  const onSubmit = async (data: EmailFormData) => {
    try {
      setStatus('sending');
      await sendEmail(data);
      setStatus('success');
      toast.success('Email sent successfully!');
      reset();
    } catch (error) {
      setStatus('error');
      toast.error((error as Error).message || 'Failed to send email');
    }
  };
  
  const togglePreview = () => {
    setIsPreviewOpen(!isPreviewOpen);
  };

  return (
    <div className="w-full max-w-2xl">
      <form 
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-lg shadow-md p-6 space-y-6"
      >
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send Email with Link</h2>
        
        <div className="space-y-4">
          {/* Recipient Email */}
          <div>
            <label htmlFor="recipientEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Recipient Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="recipientEmail"
                type="email"
                {...register('recipientEmail', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                  errors.recipientEmail ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm focus:outline-none focus:ring-2 transition duration-200 ease-in-out`}
              />
            </div>
            {errors.recipientEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.recipientEmail.message}</p>
            )}
          </div>
          
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              id="subject"
              type="text"
              {...register('subject', { required: 'Subject is required' })}
              className={`block w-full px-3 py-2 rounded-md border ${
                errors.subject ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } shadow-sm focus:outline-none focus:ring-2 transition duration-200 ease-in-out`}
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>
          
          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              rows={4}
              {...register('message', { required: 'Message is required' })}
              className={`block w-full px-3 py-2 rounded-md border ${
                errors.message ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              } shadow-sm focus:outline-none focus:ring-2 transition duration-200 ease-in-out`}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>
          
          {/* Link URL and Text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Link URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LinkIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="linkUrl"
                  type="url"
                  {...register('linkUrl', { 
                    required: 'Link URL is required',
                    pattern: {
                      value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
                      message: 'Please enter a valid URL'
                    }
                  })}
                  className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                    errors.linkUrl ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                  } shadow-sm focus:outline-none focus:ring-2 transition duration-200 ease-in-out`}
                  placeholder="https://example.com"
                />
              </div>
              {errors.linkUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.linkUrl.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="linkText" className="block text-sm font-medium text-gray-700 mb-1">
                Link Text
              </label>
              <input
                id="linkText"
                type="text"
                {...register('linkText', { required: 'Link text is required' })}
                className={`block w-full px-3 py-2 rounded-md border ${
                  errors.linkText ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm focus:outline-none focus:ring-2 transition duration-200 ease-in-out`}
                placeholder="Click here"
              />
              {errors.linkText && (
                <p className="mt-1 text-sm text-red-600">{errors.linkText.message}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-2">
          <button
            type="button"
            onClick={togglePreview}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewOpen ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          <button
            type="submit"
            disabled={status === 'sending'}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === 'sending' ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                  <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Preview Panel */}
      {isPreviewOpen && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6 space-y-4 animate-fadeIn">
          <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Email Preview</h3>
          
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-700">To:</span>
              <p className="text-sm text-gray-900">{formValues.recipientEmail || 'recipient@example.com'}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700">Subject:</span>
              <p className="text-sm text-gray-900">{formValues.subject || 'Your email subject'}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-700">Message:</span>
              <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-900 whitespace-pre-line">{formValues.message || 'Your email message'}</p>
                <p className="text-sm text-gray-900 mt-4">
                  <a href={formValues.linkUrl} className="text-blue-600 hover:underline">
                    {formValues.linkText}
                  </a>
                  {" - "}
                  <span className="text-gray-500">{formValues.linkUrl || 'https://example.com'}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailForm;