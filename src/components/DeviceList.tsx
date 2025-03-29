
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Device } from '@/types';
import api from '@/services/api';
import { formatTimeAgo, formatBytes, getStatusClass } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Smartphone, Search, RotateCw } from 'lucide-react';

const DeviceList = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await api.getDevices();
      setDevices(data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch devices. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartBackup = async (deviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      toast({
        title: 'Backup Started',
        description: 'Backup process has been initiated.',
      });
      await api.startBackup(deviceId);
    } catch (error) {
      console.error('Failed to start backup:', error);
      toast({
        title: 'Error',
        description: 'Failed to start backup. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const filteredDevices = devices.filter(device => 
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ipAddress.includes(searchTerm) ||
    device.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 justify-between">
        <div className="flex items-center w-full max-w-md">
          <Input
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDevices}
          className="whitespace-nowrap"
        >
          <RotateCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="cursor-pointer">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="text-center py-8">
          <Smartphone className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">No devices found</h3>
          <p className="text-muted-foreground">
            {searchTerm ? 'Try a different search term' : 'Add devices to get started'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            const storagePercentage = (device.storageUsed / device.storageTotal) * 100;
            
            return (
              <Card 
                key={device.id} 
                className="cursor-pointer hover:border-iot-blue transition-colors"
                onClick={() => navigate(`/device/${device.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{device.name}</CardTitle>
                    <div className="flex items-center space-x-1">
                      <span className={`status-circle ${getStatusClass(device.status)}`}></span>
                      <span className="text-sm">{device.status}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">IP Address</p>
                        <p className="text-sm">{device.ipAddress}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="text-sm">{device.type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Seen</p>
                        <p className="text-sm">{formatTimeAgo(device.lastSeen)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last Backup</p>
                        <p className="text-sm">{formatTimeAgo(device.lastBackup)}</p>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Storage</span>
                        <span>{formatBytes(device.storageUsed)} / {formatBytes(device.storageTotal)}</span>
                      </div>
                      <Progress value={storagePercentage} className="h-2" />
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        size="sm" 
                        className="w-full"
                        disabled={device.status === 'offline'}
                        onClick={(e) => handleStartBackup(device.id, e)}
                      >
                        <RotateCw className="h-4 w-4 mr-2" /> Backup Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DeviceList;
