
import React, { useState, useEffect } from 'react';
import { BackupSchedule, Device } from '@/types';
import api from '@/services/api';
import { formatDate } from '@/utils/formatters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock, Save } from 'lucide-react';

interface ScheduleConfigProps {
  deviceId: string;
}

const ScheduleConfig: React.FC<ScheduleConfigProps> = ({ deviceId }) => {
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [deviceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const scheduleData = await api.getDeviceSchedule(deviceId);
      const deviceData = await api.getDevice(deviceId);
      
      if (scheduleData) {
        setSchedule(scheduleData);
      } else {
        // Create a default schedule if none exists
        setSchedule({
          id: '',
          deviceId,
          frequency: 'daily',
          time: '00:00',
          retention: 7,
          enabled: false
        });
      }
      
      if (deviceData) {
        setDevice(deviceData);
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to load backup schedule.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schedule) return;
    
    try {
      setSaving(true);
      await api.updateSchedule(schedule);
      toast({
        title: 'Success',
        description: 'Backup schedule saved successfully.',
      });
    } catch (error) {
      console.error('Failed to save schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save backup schedule.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof BackupSchedule, value: any) => {
    if (!schedule) return;
    
    setSchedule({
      ...schedule,
      [field]: value
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48 mb-2" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!schedule || !device) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule Configuration</CardTitle>
          <CardDescription>
            Failed to load backup schedule data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-iot-blue" />
          Backup Schedule
        </CardTitle>
        <CardDescription>
          Configure automated backup schedule for {device.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled" className="font-medium">
              Enable Scheduled Backups
            </Label>
            <Switch
              id="enabled"
              checked={schedule.enabled}
              onCheckedChange={(checked) => handleChange('enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={schedule.frequency}
              onValueChange={(value) => handleChange('frequency', value)}
              disabled={!schedule.enabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {schedule.frequency === 'daily' && (
            <div className="space-y-2">
              <Label htmlFor="time">Time of day</Label>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-iot-blue" />
                <Input
                  id="time"
                  type="time"
                  value={schedule.time || '00:00'}
                  onChange={(e) => handleChange('time', e.target.value)}
                  disabled={!schedule.enabled}
                />
              </div>
            </div>
          )}

          {schedule.frequency === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of week</Label>
              <Select
                value={String(schedule.dayOfWeek || 0)}
                onValueChange={(value) => handleChange('dayOfWeek', parseInt(value))}
                disabled={!schedule.enabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {schedule.frequency === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Day of month</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min="1"
                max="31"
                value={schedule.dayOfMonth || 1}
                onChange={(e) => handleChange('dayOfMonth', parseInt(e.target.value))}
                disabled={!schedule.enabled}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="retention">Retention (days)</Label>
            <Input
              id="retention"
              type="number"
              min="1"
              value={schedule.retention}
              onChange={(e) => handleChange('retention', parseInt(e.target.value))}
              disabled={!schedule.enabled}
            />
          </div>

          {schedule.lastRun && (
            <div className="pt-2 text-sm text-muted-foreground">
              <p>Last run: {formatDate(schedule.lastRun)}</p>
              {schedule.nextRun && <p>Next run: {formatDate(schedule.nextRun)}</p>}
            </div>
          )}

          <Button 
            onClick={handleSave} 
            disabled={saving || !schedule.enabled}
            className="w-full mt-2"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScheduleConfig;
