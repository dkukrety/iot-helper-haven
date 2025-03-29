
import React, { useEffect, useState } from 'react';
import { ServerStatus } from '@/types';
import { formatBytes, formatUptime, getStatusClass } from '@/utils/formatters';
import api from '@/services/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Clock, 
  HardDrive, 
  Cpu, 
  Smartphone 
} from 'lucide-react';

const StatusBar = () => {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await api.getServerStatus();
        setStatus(data);
      } catch (error) {
        console.error('Failed to fetch server status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-card p-4 rounded-lg shadow-sm flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-card p-4 rounded-lg shadow-sm">
        <p className="text-destructive">Failed to load server status</p>
      </div>
    );
  }

  const storagePercentage = (status.storageUsed / status.storageTotal) * 100;

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="flex items-center">
          <Server className="mr-2 h-5 w-5 text-iot-blue" />
          <div>
            <p className="text-sm font-medium">Server</p>
            <div className="flex items-center">
              <span className={`status-circle ${getStatusClass(status.status)}`}></span>
              <span className="text-sm">{status.status}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <Clock className="mr-2 h-5 w-5 text-iot-blue" />
          <div>
            <p className="text-sm font-medium">Uptime</p>
            <p className="text-sm">{formatUptime(status.uptime)}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <HardDrive className="mr-2 h-5 w-5 text-iot-blue" />
          <div>
            <p className="text-sm font-medium">Storage</p>
            <div className="w-full max-w-[120px]">
              <div className="flex justify-between text-xs mb-1">
                <span>{Math.round(storagePercentage)}%</span>
                <span>{formatBytes(status.storageUsed)} / {formatBytes(status.storageTotal)}</span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <Cpu className="mr-2 h-5 w-5 text-iot-blue" />
          <div>
            <p className="text-sm font-medium">CPU / Memory</p>
            <p className="text-sm">{status.cpuUsage}% / {status.memoryUsage}%</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <Smartphone className="mr-2 h-5 w-5 text-iot-blue" />
          <div>
            <p className="text-sm font-medium">Devices</p>
            <p className="text-sm">{status.connectedDevices} connected</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;
