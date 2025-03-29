
import { Device, Backup, BackupLog, BackupSchedule, ServerStatus } from '@/types';

// Mock data for development
const mockDevices: Device[] = [
  {
    id: '1',
    name: 'Temperature Sensor',
    ipAddress: '192.168.1.101',
    status: 'online',
    lastSeen: new Date().toISOString(),
    lastBackup: new Date(Date.now() - 3600000).toISOString(),
    type: 'Sensor',
    osVersion: 'Linux 5.10.0',
    storageTotal: 16000000000,
    storageUsed: 5000000000
  },
  {
    id: '2',
    name: 'Gateway Router',
    ipAddress: '192.168.1.1',
    status: 'online',
    lastSeen: new Date().toISOString(),
    lastBackup: new Date(Date.now() - 86400000).toISOString(),
    type: 'Gateway',
    osVersion: 'Linux 5.15.0',
    storageTotal: 32000000000,
    storageUsed: 12000000000
  },
  {
    id: '3',
    name: 'Security Camera',
    ipAddress: '192.168.1.115',
    status: 'warning',
    lastSeen: new Date(Date.now() - 1800000).toISOString(),
    lastBackup: new Date(Date.now() - 172800000).toISOString(),
    type: 'Camera',
    osVersion: 'Linux 5.4.0',
    storageTotal: 64000000000,
    storageUsed: 48000000000
  },
  {
    id: '4',
    name: 'Smart Thermostat',
    ipAddress: '192.168.1.120',
    status: 'offline',
    lastSeen: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastBackup: new Date(Date.now() - 86400000 * 5).toISOString(),
    type: 'Thermostat',
    osVersion: 'Linux 4.9.0',
    storageTotal: 8000000000,
    storageUsed: 3000000000
  }
];

const mockBackups: Backup[] = [
  {
    id: '1',
    deviceId: '1',
    deviceName: 'Temperature Sensor',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    size: 128000000,
    status: 'completed',
    location: 'both',
    type: 'scheduled',
    version: '1.0.0',
    files: 1250
  },
  {
    id: '2',
    deviceId: '1',
    deviceName: 'Temperature Sensor',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    size: 125000000,
    status: 'completed',
    location: 'both',
    type: 'scheduled',
    version: '1.0.0',
    files: 1248
  },
  {
    id: '3',
    deviceId: '2',
    deviceName: 'Gateway Router',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    size: 256000000,
    status: 'completed',
    location: 'both',
    type: 'manual',
    version: '1.0.0',
    files: 2540
  },
  {
    id: '4',
    deviceId: '3',
    deviceName: 'Security Camera',
    timestamp: new Date(Date.now() - 172800000).toISOString(),
    size: 2048000000,
    status: 'completed',
    location: 'server',
    type: 'scheduled',
    version: '1.0.0',
    files: 4120
  },
  {
    id: '5',
    deviceId: '4',
    deviceName: 'Smart Thermostat',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    size: 64000000,
    status: 'completed',
    location: 'both',
    type: 'scheduled',
    version: '1.0.0',
    files: 980
  },
  {
    id: '6',
    deviceId: '2',
    deviceName: 'Gateway Router',
    timestamp: new Date().toISOString(),
    size: 260000000,
    status: 'in-progress',
    location: 'local',
    type: 'manual',
    version: '1.0.0',
    files: 2600
  }
];

const mockLogs: BackupLog[] = [
  {
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    level: 'info',
    message: 'Backup completed successfully',
    deviceId: '1',
    backupId: '1'
  },
  {
    timestamp: new Date(Date.now() - 3600000 + 60000).toISOString(),
    level: 'info',
    message: 'Backup uploaded to server',
    deviceId: '1',
    backupId: '1'
  },
  {
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    level: 'warning',
    message: 'Low storage space on device',
    deviceId: '3'
  },
  {
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    level: 'error',
    message: 'Connection to device lost',
    deviceId: '4'
  },
  {
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Starting backup',
    deviceId: '2',
    backupId: '6'
  }
];

const mockSchedules: BackupSchedule[] = [
  {
    id: '1',
    deviceId: '1',
    frequency: 'daily',
    time: '00:00',
    retention: 7,
    enabled: true,
    lastRun: new Date(Date.now() - 3600000).toISOString(),
    nextRun: new Date(Date.now() + 86400000 - 3600000).toISOString()
  },
  {
    id: '2',
    deviceId: '2',
    frequency: 'daily',
    time: '01:00',
    retention: 14,
    enabled: true,
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    nextRun: new Date(Date.now() + 3600000).toISOString()
  },
  {
    id: '3',
    deviceId: '3',
    frequency: 'weekly',
    time: '02:00',
    dayOfWeek: 0,
    retention: 4,
    enabled: true,
    lastRun: new Date(Date.now() - 172800000).toISOString(),
    nextRun: new Date(Date.now() + 86400000 * 5).toISOString()
  },
  {
    id: '4',
    deviceId: '4',
    frequency: 'daily',
    time: '03:00',
    retention: 7,
    enabled: false,
    lastRun: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

const mockServerStatus: ServerStatus = {
  id: '1',
  status: 'online',
  uptime: 86400 * 15, // 15 days in seconds
  version: '1.0.0',
  connectedDevices: 3,
  storageTotal: 1000000000000, // 1TB
  storageUsed: 350000000000,  // 350GB
  lastBackupTime: new Date(Date.now() - 3600000).toISOString(),
  cpuUsage: 25,
  memoryUsage: 40
};

// API Class
class API {
  // Devices
  async getDevices(): Promise<Device[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockDevices), 500);
    });
  }

  async getDevice(id: string): Promise<Device | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockDevices.find(d => d.id === id)), 500);
    });
  }

  async startBackup(deviceId: string): Promise<Backup> {
    const device = mockDevices.find(d => d.id === deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    const newBackup: Backup = {
      id: `backup-${Date.now()}`,
      deviceId,
      deviceName: device.name,
      timestamp: new Date().toISOString(),
      size: 0,
      status: 'in-progress',
      location: 'local',
      type: 'manual',
      version: '1.0.0',
      files: 0
    };

    return new Promise((resolve) => {
      setTimeout(() => resolve(newBackup), 500);
    });
  }

  // Backups
  async getBackups(): Promise<Backup[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...mockBackups]), 500);
    });
  }

  async getDeviceBackups(deviceId: string): Promise<Backup[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockBackups.filter(b => b.deviceId === deviceId)), 500);
    });
  }

  async getBackup(id: string): Promise<Backup | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockBackups.find(b => b.id === id)), 500);
    });
  }

  async restoreBackup(backupId: string, deviceId?: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 2000);
    });
  }

  // Logs
  async getLogs(): Promise<BackupLog[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockLogs), 500);
    });
  }

  async getDeviceLogs(deviceId: string): Promise<BackupLog[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockLogs.filter(l => l.deviceId === deviceId)), 500);
    });
  }

  async getBackupLogs(backupId: string): Promise<BackupLog[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockLogs.filter(l => l.backupId === backupId)), 500);
    });
  }

  // Schedules
  async getSchedules(): Promise<BackupSchedule[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSchedules), 500);
    });
  }

  async getDeviceSchedule(deviceId: string): Promise<BackupSchedule | undefined> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockSchedules.find(s => s.deviceId === deviceId)), 500);
    });
  }

  async updateSchedule(schedule: BackupSchedule): Promise<BackupSchedule> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(schedule), 500);
    });
  }

  // Server Status
  async getServerStatus(): Promise<ServerStatus> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockServerStatus), 500);
    });
  }
}

export const api = new API();

export default api;
