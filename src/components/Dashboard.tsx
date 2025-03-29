
import React from 'react';
import StatusBar from './StatusBar';
import DeviceList from './DeviceList';
import BackupHistory from './BackupHistory';
import LogViewer from './LogViewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Smartphone, HardDrive, FileText } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">IoT Backup Manager</h1>
      </div>
      
      <StatusBar />
      
      <Tabs defaultValue="devices" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="devices" className="flex items-center">
            <Smartphone className="h-4 w-4 mr-2" /> Devices
          </TabsTrigger>
          <TabsTrigger value="backups" className="flex items-center">
            <HardDrive className="h-4 w-4 mr-2" /> Backups
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" /> Logs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="devices" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>IoT Devices</CardTitle>
              <CardDescription>
                View and manage your IoT devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceList />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="backups" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>
                View and restore your device backups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BackupHistory />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="logs" className="m-0">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>
                View backup and device logs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LogViewer maxHeight="400px" showTitle={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
