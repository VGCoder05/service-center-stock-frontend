import { toast } from 'react-toastify';

// Default toast configuration
const defaultOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true
};

// Toast utility functions
export const showToast = {
  success: (message, options = {}) => {
    toast.success(message, { ...defaultOptions, ...options });
  },
  
  error: (message, options = {}) => {
    toast.error(message, { ...defaultOptions, autoClose: 5000, ...options });
  },
  
  warning: (message, options = {}) => {
    toast.warning(message, { ...defaultOptions, ...options });
  },
  
  info: (message, options = {}) => {
    toast.info(message, { ...defaultOptions, ...options });
  },

  // For promises (loading → success/error)
  promise: (promise, messages, options = {}) => {
    return toast.promise(promise, {
      pending: messages.pending || 'Processing...',
      success: messages.success || 'Success!',
      error: messages.error || 'Something went wrong'
    }, { ...defaultOptions, ...options });
  }
};

export default showToast;