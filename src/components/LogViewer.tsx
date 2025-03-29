
import React, { useState, useEffect } from 'react';
import { BackupLog } from '@/types';
import api from '@/services/api';
import { formatDate } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCw, FileText, AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface LogViewerProps {
  deviceId?: string;
  backupId?: string;
  maxHeight?: string;
  showTitle?: boolean;
}

const LogViewer: React.FC<LogViewerProps> = ({ 
  deviceId, 
  backupId, 
  maxHeight = '300px',
  showTitle = true
}) => {
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [deviceId, backupId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let data: BackupLog[];
      
      if (backupId) {
        data = await api.getBackupLogs(backupId);
      } else if (deviceId) {
        data = await api.getDeviceLogs(deviceId);
      } else {
        data = await api.getLogs();
      }
      
      // Sort by timestamp (newest first)
      data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load logs.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return <Info className="h-4 w-4 text-iot-blue" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-iot-yellow" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-iot-red" />;
    }
  };

  const getLevelClass = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return 'text-iot-blue';
      case 'warning':
        return 'text-iot-yellow';
      case 'error':
        return 'text-iot-red';
    }
  };

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              System Logs
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
            >
              <RotateCw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-4">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">No logs available</p>
          </div>
        ) : (
          <ScrollArea className={`max-h-[${maxHeight}]`}>
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center">
                    {getLevelIcon(log.level)}
                    <span className={`ml-2 font-medium ${getLevelClass(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1 ml-6">{log.message}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default LogViewer;
