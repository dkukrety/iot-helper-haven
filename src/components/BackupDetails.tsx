
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Backup, Device } from '@/types';
import api from '@/services/api';
import { formatDate, formatBytes, getStatusClass, getStatusColor } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import LogViewer from './LogViewer';
import { 
  ArrowLeft, 
  Download, 
  HardDrive, 
  Server, 
  Calendar, 
  Clock,
  FileType,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';

const BackupDetailsComponent = () => {
  const { backupId } = useParams<{ backupId: string }>();
  const [backup, setBackup] = useState<Backup | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!backupId) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const backupData = await api.getBackup(backupId);
        
        if (backupData) {
          setBackup(backupData);
          
          const deviceData = await api.getDevice(backupData.deviceId);
          if (deviceData) {
            setDevice(deviceData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch backup details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load backup details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [backupId]);

  const handleRestore = async () => {
    if (!backup) return;
    
    try {
      setRestoring(true);
      toast({
        title: 'Restore Started',
        description: 'Restore process has been initiated.',
      });
      
      await api.restoreBackup(backup.id, backup.deviceId);
      
      toast({
        title: 'Success',
        description: 'Restore completed successfully.',
      });
    } catch (error) {
      console.error('Failed to restore backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore backup.',
        variant: 'destructive',
      });
    } finally {
      setRestoring(false);
    }
  };

  const getStatusIcon = (status: 'completed' | 'failed' | 'in-progress') => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-iot-green" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-iot-red" />;
      case 'in-progress':
        return <RefreshCw className="h-5 w-5 text-iot-blue animate-spin" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
        
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!backup || !device) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        
        <Card>
          <CardHeader>
            <CardTitle>Backup Not Found</CardTitle>
            <CardDescription>
              The requested backup could not be found.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/backups')}>
              View All Backups
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <span className={`status-circle ${getStatusClass(backup.status)}`}></span>
                Backup: {backup.deviceName}
              </CardTitle>
              <CardDescription>
                {formatDate(backup.timestamp)}
              </CardDescription>
            </div>
            <div className="flex items-center">
              {getStatusIcon(backup.status)}
              <span className={`ml-2 font-medium ${getStatusColor(backup.status)}`}>
                {backup.status === 'completed' ? 'Completed' : 
                 backup.status === 'failed' ? 'Failed' : 
                 'In Progress'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Backup Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Size</p>
                  <p className="font-medium flex items-center">
                    <HardDrive className="h-4 w-4 mr-2 text-iot-blue" />
                    {formatBytes(backup.size)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Files</p>
                  <p className="font-medium flex items-center">
                    <FileType className="h-4 w-4 mr-2 text-iot-blue" />
                    {backup.files}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium flex items-center">
                    {backup.type === 'scheduled' ? (
                      <Calendar className="h-4 w-4 mr-2 text-iot-blue" />
                    ) : (
                      <Clock className="h-4 w-4 mr-2 text-iot-blue" />
                    )}
                    {backup.type === 'scheduled' ? 'Scheduled' : 'Manual'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium flex items-center">
                    {backup.location === 'local' ? (
                      <HardDrive className="h-4 w-4 mr-2 text-iot-blue" />
                    ) : backup.location === 'server' ? (
                      <Server className="h-4 w-4 mr-2 text-iot-blue" />
                    ) : (
                      <span className="flex items-center">
                        <HardDrive className="h-4 w-4 mr-2 text-iot-blue" />
                        +
                        <Server className="h-4 w-4 ml-1 text-iot-blue" />
                      </span>
                    )}
                    {backup.location === 'local' ? 'Local Only' : 
                     backup.location === 'server' ? 'Server Only' : 
                     'Both'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-medium">{backup.version}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Device ID</p>
                  <p className="font-medium">{backup.deviceId}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  className="w-full"
                  disabled={backup.status !== 'completed' || restoring}
                  onClick={handleRestore}
                >
                  {restoring ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Restoring...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" /> Restore Backup
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Device Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{device.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IP Address</p>
                  <p className="font-medium">{device.ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{device.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">OS Version</p>
                  <p className="font-medium">{device.osVersion}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="font-medium flex items-center">
                    <span className={`status-circle ${getStatusClass(device.status)}`}></span>
                    {device.status}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Seen</p>
                  <p className="font-medium">{formatDate(device.lastSeen)}</p>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/device/${device.id}`)}
                >
                  View Device Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <LogViewer backupId={backup.id} />
    </div>
  );
};

export default BackupDetailsComponent;
