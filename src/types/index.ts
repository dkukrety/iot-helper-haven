
export interface Device {
  id: string;
  name: string;
  ipAddress: string;
  status: 'online' | 'offline' | 'warning';
  lastSeen: string;
  lastBackup: string;
  type: string;
  osVersion: string;
  storageTotal: number;
  storageUsed: number;
}

export interface Backup {
  id: string;
  deviceId: string;
  deviceName: string;
  timestamp: string;
  size: number;
  status: 'completed' | 'failed' | 'in-progress';
  location: 'local' | 'server' | 'both';
  type: 'scheduled' | 'manual';
  version: string;
  files: number;
}

export interface BackupLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  deviceId?: string;
  backupId?: string;
}

export interface BackupSchedule {
  id: string;
  deviceId: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  retention: number;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export interface ServerStatus {
  id: string;
  status: 'online' | 'offline' | 'warning';
  uptime: number;
  version: string;
  connectedDevices: number;
  storageTotal: number;
  storageUsed: number;
  lastBackupTime?: string;
  cpuUsage: number;
  memoryUsage: number;
}
