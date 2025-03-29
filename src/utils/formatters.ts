
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleString();
};

export const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (seconds < 60) {
    return `${seconds} seconds ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }
  
  const years = Math.floor(months / 12);
  return `${years} year${years > 1 ? 's' : ''} ago`;
};

export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
};

export const getStatusColor = (status: 'online' | 'offline' | 'warning' | 'completed' | 'failed' | 'in-progress'): string => {
  switch (status) {
    case 'online':
    case 'completed':
      return 'text-iot-green';
    case 'offline':
    case 'failed':
      return 'text-iot-red';
    case 'warning':
      return 'text-iot-yellow';
    case 'in-progress':
      return 'text-iot-blue';
    default:
      return 'text-gray-500';
  }
};

export const getStatusClass = (status: 'online' | 'offline' | 'warning' | 'completed' | 'failed' | 'in-progress'): string => {
  switch (status) {
    case 'online':
    case 'completed':
      return 'status-online';
    case 'offline':
    case 'failed':
      return 'status-offline';
    case 'warning':
      return 'status-warning';
    case 'in-progress':
      return 'bg-iot-blue';
    default:
      return 'bg-gray-500';
  }
};
