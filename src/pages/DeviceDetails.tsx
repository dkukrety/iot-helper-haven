
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Device } from '@/types';
import api from '@/services/api';
import { formatTimeAgo, formatBytes, getStatusClass } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import BackupHistory from '@/components/BackupHistory';
import ScheduleConfig from '@/components/ScheduleConfig';
import LogViewer from '@/components/LogViewer';
import { 
  ArrowLeft, 
  RotateCw, 
  Smartphone, 
  Server,
  HardDrive,
  Terminal,
  Clock
} from 'lucide-react';

const DeviceDetails = () => {
  const { deviceId } = useParams<{ deviceId: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!deviceId) return;
    fetchDevice();
  }, [deviceId]);

  const fetchDevice = async () => {
    if (!deviceId) return;
    
    try {
      setLoading(true);
      const data = await api.getDevice(deviceId);
      if (data) {
        setDevice(data);
      }
    } catch (error) {
      console.error('Failed to fetch device:', error);
      toast({
        title: 'Error',
        description: 'Failed to load device details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartBackup = async () => {
    if (!deviceId) return;
    
    try {
      setBackupLoading(true);
      toast({
        title: 'Backup Started',
        description: 'Backup process has been initiated.',
      });
      
      await api.startBackup(deviceId);
    } catch (error) {
      console.error('Failed to start backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to start backup.',
        variant: 'destructive',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Device Not Found</CardTitle>
            <CardDescription>
              The requested device could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')}>
              View All Devices
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storagePercentage = (device.storageUsed / device.storageTotal) * 100;

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-iot-blue" />
                {device.name}
              </CardTitle>
              <CardDescription>
                {device.ipAddress} - {device.type}
              </CardDescription>
            </div>
            <div className="flex items-center">
              <span className={`status-circle ${getStatusClass(device.status)}`}></span>
              <span className="mr-4">{device.status}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDevice}
              >
                <RotateCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Device Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">OS Version</p>
                    <p className="font-medium flex items-center">
                      <Terminal className="h-4 w-4 mr-2 text-iot-blue" />
                      {device.osVersion}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Seen</p>
                    <p className="font-medium flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-iot-blue" />
                      {formatTimeAgo(device.lastSeen)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Backup</p>
                    <p className="font-medium">{formatTimeAgo(device.lastBackup)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Storage</p>
                    <div className="flex flex-col">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{Math.round(storagePercentage)}%</span>
                        <span>{formatBytes(device.storageUsed)} / {formatBytes(device.storageTotal)}</span>
                      </div>
                      <Progress value={storagePercentage} className="h-2" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Button 
                    className="w-full"
                    disabled={device.status === 'offline' || backupLoading}
                    onClick={handleStartBackup}
                  >
                    {backupLoading ? (
                      <>
                        <RotateCw className="h-4 w-4 mr-2 animate-spin" /> Backup in progress...
                      </>
                    ) : (
                      <>
                        <Server className="h-4 w-4 mr-2" /> Start Backup Now
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <div className="md:col-span-1">
              <ScheduleConfig deviceId={device.id} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <HardDrive className="h-4 w-4 mr-2" />
            Backup History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <BackupHistory deviceId={device.id} />
        </CardContent>
      </Card>
      
      <LogViewer deviceId={device.id} />
    </div>
  );
};

export default DeviceDetails;
