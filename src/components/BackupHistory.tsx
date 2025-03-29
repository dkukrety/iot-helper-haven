
import React, { useState, useEffect } from 'react';
import { Backup } from '@/types';
import api from '@/services/api';
import { formatDate, formatBytes, getStatusClass, getStatusColor } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { 
  Download, 
  RotateCw, 
  HardDrive, 
  Server, 
  Smartphone,
  Clock,
  CalendarIcon
} from 'lucide-react';

interface BackupHistoryProps {
  deviceId?: string;
  limit?: number;
}

const BackupHistory: React.FC<BackupHistoryProps> = ({ deviceId, limit }) => {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'in-progress'>('all');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBackups();
  }, [deviceId]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      let data: Backup[];
      
      if (deviceId) {
        data = await api.getDeviceBackups(deviceId);
      } else {
        data = await api.getBackups();
      }
      
      // Sort by timestamp (newest first)
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      // Apply limit if provided
      if (limit && data.length > limit) {
        data = data.slice(0, limit);
      }
      
      setBackups(data);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      toast({
        title: 'Error',
        description: 'Failed to load backup history.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast({
        title: 'Restore Started',
        description: 'Restore process has been initiated.',
      });
      
      await api.restoreBackup(backupId, deviceId);
      
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
    }
  };

  const filteredBackups = filter === 'all' 
    ? backups 
    : backups.filter(backup => backup.status === filter);

  const renderBackupItem = (backup: Backup) => (
    <Card 
      key={backup.id} 
      className="cursor-pointer hover:border-iot-blue transition-colors"
      onClick={() => navigate(`/backup/${backup.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className={`status-circle ${getStatusClass(backup.status)}`}></span>
            <CardTitle className="text-base">
              {backup.deviceName}
            </CardTitle>
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {formatDate(backup.timestamp)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Size</p>
            <p className="text-sm flex items-center">
              <HardDrive className="h-3 w-3 mr-1 text-iot-blue" />
              {formatBytes(backup.size)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Files</p>
            <p className="text-sm">{backup.files}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="text-sm flex items-center">
              {backup.type === 'scheduled' ? (
                <CalendarIcon className="h-3 w-3 mr-1 text-iot-blue" />
              ) : (
                <Smartphone className="h-3 w-3 mr-1 text-iot-blue" />
              )}
              {backup.type === 'scheduled' ? 'Scheduled' : 'Manual'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Location</p>
            <p className="text-sm flex items-center">
              {backup.location === 'local' ? (
                <HardDrive className="h-3 w-3 mr-1 text-iot-blue" />
              ) : backup.location === 'server' ? (
                <Server className="h-3 w-3 mr-1 text-iot-blue" />
              ) : (
                <span className="flex items-center">
                  <HardDrive className="h-3 w-3 mr-1 text-iot-blue" />
                  +
                  <Server className="h-3 w-3 ml-1 text-iot-blue" />
                </span>
              )}
              {backup.location === 'local' ? 'Local Only' : 
               backup.location === 'server' ? 'Server Only' : 
               'Both'}
            </p>
          </div>
        </div>
        
        <Button 
          size="sm" 
          variant="outline"
          className="w-full"
          disabled={backup.status !== 'completed'}
          onClick={(e) => handleRestoreBackup(backup.id, e)}
        >
          <Download className="h-4 w-4 mr-2" /> Restore
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Backup History</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBackups}
        >
          <RotateCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setFilter(value as any)}>
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="m-0">
          {renderBackupList()}
        </TabsContent>
        <TabsContent value="completed" className="m-0">
          {renderBackupList()}
        </TabsContent>
        <TabsContent value="in-progress" className="m-0">
          {renderBackupList()}
        </TabsContent>
        <TabsContent value="failed" className="m-0">
          {renderBackupList()}
        </TabsContent>
      </Tabs>
    </div>
  );

  function renderBackupList() {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (filteredBackups.length === 0) {
      return (
        <div className="text-center py-8">
          <HardDrive className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">No backups found</h3>
          <p className="text-muted-foreground">
            {filter !== 'all' ? 'Try a different filter' : 'No backups have been created yet'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBackups.map(renderBackupItem)}
      </div>
    );
  }
};

export default BackupHistory;
