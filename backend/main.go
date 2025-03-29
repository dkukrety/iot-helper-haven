package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

// Models matching our frontend types
type Device struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	IPAddress    string    `json:"ipAddress"`
	Status       string    `json:"status"`
	LastSeen     time.Time `json:"lastSeen"`
	LastBackup   time.Time `json:"lastBackup"`
	Type         string    `json:"type"`
	OSVersion    string    `json:"osVersion"`
	StorageTotal int64     `json:"storageTotal"`
	StorageUsed  int64     `json:"storageUsed"`
}

type Backup struct {
	ID         string    `json:"id"`
	DeviceID   string    `json:"deviceId"`
	DeviceName string    `json:"deviceName"`
	Timestamp  time.Time `json:"timestamp"`
	Size       int64     `json:"size"`
	Status     string    `json:"status"`
	Location   string    `json:"location"`
	Type       string    `json:"type"`
	Version    string    `json:"version"`
	Files      int       `json:"files"`
}

type BackupLog struct {
	Timestamp time.Time `json:"timestamp"`
	Level     string    `json:"level"`
	Message   string    `json:"message"`
	DeviceID  string    `json:"deviceId,omitempty"`
	BackupID  string    `json:"backupId,omitempty"`
}

type BackupSchedule struct {
	ID         string     `json:"id"`
	DeviceID   string     `json:"deviceId"`
	Frequency  string     `json:"frequency"`
	Time       string     `json:"time,omitempty"`
	DayOfWeek  *int       `json:"dayOfWeek,omitempty"`
	DayOfMonth *int       `json:"dayOfMonth,omitempty"`
	Retention  int        `json:"retention"`
	Enabled    bool       `json:"enabled"`
	LastRun    *time.Time `json:"lastRun,omitempty"`
	NextRun    *time.Time `json:"nextRun,omitempty"`
}

type ServerStatus struct {
	ID               string     `json:"id"`
	Status           string     `json:"status"`
	Uptime           int64      `json:"uptime"`
	Version          string     `json:"version"`
	ConnectedDevices int        `json:"connectedDevices"`
	StorageTotal     int64      `json:"storageTotal"`
	StorageUsed      int64      `json:"storageUsed"`
	LastBackupTime   *time.Time `json:"lastBackupTime,omitempty"`
	CPUUsage         int        `json:"cpuUsage"`
	MemoryUsage      int        `json:"memoryUsage"`
}

// In-memory database (for demo purposes)
var devices []Device
var backups []Backup
var logs []BackupLog
var schedules []BackupSchedule
var serverStatus ServerStatus

func initData() {
	// Initialize devices
	now := time.Now()
	devices = []Device{
		{
			ID:           "1",
			Name:         "Temperature Sensor",
			IPAddress:    "192.168.1.101",
			Status:       "online",
			LastSeen:     now,
			LastBackup:   now.Add(-1 * time.Hour),
			Type:         "Sensor",
			OSVersion:    "Linux 5.10.0",
			StorageTotal: 16000000000,
			StorageUsed:  5000000000,
		},
		{
			ID:           "2",
			Name:         "Gateway Router",
			IPAddress:    "192.168.1.1",
			Status:       "online",
			LastSeen:     now,
			LastBackup:   now.Add(-24 * time.Hour),
			Type:         "Gateway",
			OSVersion:    "Linux 5.15.0",
			StorageTotal: 32000000000,
			StorageUsed:  12000000000,
		},
		{
			ID:           "3",
			Name:         "Security Camera",
			IPAddress:    "192.168.1.115",
			Status:       "warning",
			LastSeen:     now.Add(-30 * time.Minute),
			LastBackup:   now.Add(-48 * time.Hour),
			Type:         "Camera",
			OSVersion:    "Linux 5.4.0",
			StorageTotal: 64000000000,
			StorageUsed:  48000000000,
		},
		{
			ID:           "4",
			Name:         "Smart Thermostat",
			IPAddress:    "192.168.1.120",
			Status:       "offline",
			LastSeen:     now.Add(-48 * time.Hour),
			LastBackup:   now.Add(-120 * time.Hour),
			Type:         "Thermostat",
			OSVersion:    "Linux 4.9.0",
			StorageTotal: 8000000000,
			StorageUsed:  3000000000,
		},
	}

	// Initialize backups
	backups = []Backup{
		{
			ID:         "1",
			DeviceID:   "1",
			DeviceName: "Temperature Sensor",
			Timestamp:  now.Add(-1 * time.Hour),
			Size:       128000000,
			Status:     "completed",
			Location:   "both",
			Type:       "scheduled",
			Version:    "1.0.0",
			Files:      1250,
		},
		{
			ID:         "2",
			DeviceID:   "1",
			DeviceName: "Temperature Sensor",
			Timestamp:  now.Add(-24 * time.Hour),
			Size:       125000000,
			Status:     "completed",
			Location:   "both",
			Type:       "scheduled",
			Version:    "1.0.0",
			Files:      1248,
		},
		{
			ID:         "3",
			DeviceID:   "2",
			DeviceName: "Gateway Router",
			Timestamp:  now.Add(-24 * time.Hour),
			Size:       256000000,
			Status:     "completed",
			Location:   "both",
			Type:       "manual",
			Version:    "1.0.0",
			Files:      2540,
		},
		{
			ID:         "4",
			DeviceID:   "3",
			DeviceName: "Security Camera",
			Timestamp:  now.Add(-48 * time.Hour),
			Size:       2048000000,
			Status:     "completed",
			Location:   "server",
			Type:       "scheduled",
			Version:    "1.0.0",
			Files:      4120,
		},
		{
			ID:         "5",
			DeviceID:   "4",
			DeviceName: "Smart Thermostat",
			Timestamp:  now.Add(-120 * time.Hour),
			Size:       64000000,
			Status:     "completed",
			Location:   "both",
			Type:       "scheduled",
			Version:    "1.0.0",
			Files:      980,
		},
		{
			ID:         "6",
			DeviceID:   "2",
			DeviceName: "Gateway Router",
			Timestamp:  now,
			Size:       260000000,
			Status:     "in-progress",
			Location:   "local",
			Type:       "manual",
			Version:    "1.0.0",
			Files:      2600,
		},
	}

	// Initialize logs
	logs = []BackupLog{
		{
			Timestamp: now.Add(-1 * time.Hour),
			Level:     "info",
			Message:   "Backup completed successfully",
			DeviceID:  "1",
			BackupID:  "1",
		},
		{
			Timestamp: now.Add(-1*time.Hour + time.Minute),
			Level:     "info",
			Message:   "Backup uploaded to server",
			DeviceID:  "1",
			BackupID:  "1",
		},
		{
			Timestamp: now.Add(-30 * time.Minute),
			Level:     "warning",
			Message:   "Low storage space on device",
			DeviceID:  "3",
		},
		{
			Timestamp: now.Add(-48 * time.Hour),
			Level:     "error",
			Message:   "Connection to device lost",
			DeviceID:  "4",
		},
		{
			Timestamp: now,
			Level:     "info",
			Message:   "Starting backup",
			DeviceID:  "2",
			BackupID:  "6",
		},
	}

	// Initialize schedules
	dayOfWeek := 0
	schedules = []BackupSchedule{
		{
			ID:        "1",
			DeviceID:  "1",
			Frequency: "daily",
			Time:      "00:00",
			Retention: 7,
			Enabled:   true,
			LastRun:   &now,
			NextRun:   timePtr(now.Add(24 * time.Hour)),
		},
		{
			ID:        "2",
			DeviceID:  "2",
			Frequency: "daily",
			Time:      "01:00",
			Retention: 14,
			Enabled:   true,
			LastRun:   timePtr(now.Add(-24 * time.Hour)),
			NextRun:   timePtr(now.Add(1 * time.Hour)),
		},
		{
			ID:        "3",
			DeviceID:  "3",
			Frequency: "weekly",
			Time:      "02:00",
			DayOfWeek: &dayOfWeek,
			Retention: 4,
			Enabled:   true,
			LastRun:   timePtr(now.Add(-48 * time.Hour)),
			NextRun:   timePtr(now.Add(5 * 24 * time.Hour)),
		},
		{
			ID:        "4",
			DeviceID:  "4",
			Frequency: "daily",
			Time:      "03:00",
			Retention: 7,
			Enabled:   false,
			LastRun:   timePtr(now.Add(-5 * 24 * time.Hour)),
		},
	}

	// Initialize server status
	lastBackupTime := now.Add(-1 * time.Hour)
	serverStatus = ServerStatus{
		ID:               "1",
		Status:           "online",
		Uptime:           86400 * 15, // 15 days in seconds
		Version:          "1.0.0",
		ConnectedDevices: 3,
		StorageTotal:     1000000000000, // 1TB
		StorageUsed:      350000000000,  // 350GB
		LastBackupTime:   &lastBackupTime,
		CPUUsage:         25,
		MemoryUsage:      40,
	}
}

// Helper functions
func timePtr(t time.Time) *time.Time {
	return &t
}

func findDevice(id string) *Device {
	for i := range devices {
		if devices[i].ID == id {
			return &devices[i]
		}
	}
	return nil
}

func findBackup(id string) *Backup {
	for i := range backups {
		if backups[i].ID == id {
			return &backups[i]
		}
	}
	return nil
}

func findSchedule(deviceID string) *BackupSchedule {
	for i := range schedules {
		if schedules[i].DeviceID == deviceID {
			return &schedules[i]
		}
	}
	return nil
}

// API Handlers

// Device handlers
func getDevicesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(devices)
}

func getDeviceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	device := findDevice(id)
	if device == nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(device)
}

func startBackupHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	deviceID := vars["deviceId"]

	device := findDevice(deviceID)
	if device == nil {
		http.Error(w, "Device not found", http.StatusNotFound)
		return
	}

	// Create a new backup
	newBackup := Backup{
		ID:         fmt.Sprintf("backup-%d", time.Now().Unix()),
		DeviceID:   deviceID,
		DeviceName: device.Name,
		Timestamp:  time.Now(),
		Size:       0,
		Status:     "in-progress",
		Location:   "local",
		Type:       "manual",
		Version:    "1.0.0",
		Files:      0,
	}

	backups = append(backups, newBackup)

	// Add a log entry
	newLog := BackupLog{
		Timestamp: time.Now(),
		Level:     "info",
		Message:   "Starting backup",
		DeviceID:  deviceID,
		BackupID:  newBackup.ID,
	}

	logs = append(logs, newLog)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(newBackup)
}

// Backup handlers
func getBackupsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(backups)
}

func getDeviceBackupsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	deviceID := vars["deviceId"]

	deviceBackups := []Backup{}
	for _, backup := range backups {
		if backup.DeviceID == deviceID {
			deviceBackups = append(deviceBackups, backup)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deviceBackups)
}

func getBackupHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	backup := findBackup(id)
	if backup == nil {
		http.Error(w, "Backup not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(backup)
}

func restoreBackupHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	backupID := vars["backupId"]

	backup := findBackup(backupID)
	if backup == nil {
		http.Error(w, "Backup not found", http.StatusNotFound)
		return
	}

	// Simulating restore process
	// In a real implementation, this would trigger the actual restore process

	// Add a log entry
	newLog := BackupLog{
		Timestamp: time.Now(),
		Level:     "info",
		Message:   "Starting restore process",
		DeviceID:  backup.DeviceID,
		BackupID:  backupID,
	}

	logs = append(logs, newLog)

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"success": true}`))
}

// Log handlers
func getLogsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(logs)
}

func getDeviceLogsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	deviceID := vars["deviceId"]

	deviceLogs := []BackupLog{}
	for _, log := range logs {
		if log.DeviceID == deviceID {
			deviceLogs = append(deviceLogs, log)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(deviceLogs)
}

func getBackupLogsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	backupID := vars["backupId"]

	backupLogs := []BackupLog{}
	for _, log := range logs {
		if log.BackupID == backupID {
			backupLogs = append(backupLogs, log)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(backupLogs)
}

// Schedule handlers
func getSchedulesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(schedules)
}

func getDeviceScheduleHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	deviceID := vars["deviceId"]

	schedule := findSchedule(deviceID)
	if schedule == nil {
		http.Error(w, "Schedule not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(schedule)
}

func updateScheduleHandler(w http.ResponseWriter, r *http.Request) {
	var updatedSchedule BackupSchedule
	err := json.NewDecoder(r.Body).Decode(&updatedSchedule)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	scheduleIndex := -1
	for i, schedule := range schedules {
		if schedule.ID == updatedSchedule.ID {
			scheduleIndex = i
			break
		}
	}

	if scheduleIndex == -1 {
		// If schedule doesn't exist, create it
		schedules = append(schedules, updatedSchedule)
	} else {
		// Otherwise update it
		schedules[scheduleIndex] = updatedSchedule
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedSchedule)
}

// Server status handler
func getServerStatusHandler(w http.ResponseWriter, r *http.Request) {
	// Update some dynamic values
	serverStatus.Uptime += 60 // Add a minute to uptime
	serverStatus.CPUUsage = 20 + (serverStatus.CPUUsage % 30)
	serverStatus.MemoryUsage = 35 + (serverStatus.MemoryUsage % 20)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(serverStatus)
}

func main() {
	// Initialize data
	initData()

	// Create router
	r := mux.NewRouter()

	// API routes
	// Device routes
	r.HandleFunc("/api/devices", getDevicesHandler).Methods("GET")
	r.HandleFunc("/api/devices/{id}", getDeviceHandler).Methods("GET")
	r.HandleFunc("/api/devices/{deviceId}/backup", startBackupHandler).Methods("POST")

	// Backup routes
	r.HandleFunc("/api/backups", getBackupsHandler).Methods("GET")
	r.HandleFunc("/api/devices/{deviceId}/backups", getDeviceBackupsHandler).Methods("GET")
	r.HandleFunc("/api/backups/{id}", getBackupHandler).Methods("GET")
	r.HandleFunc("/api/backups/{backupId}/restore", restoreBackupHandler).Methods("POST")

	// Log routes
	r.HandleFunc("/api/logs", getLogsHandler).Methods("GET")
	r.HandleFunc("/api/devices/{deviceId}/logs", getDeviceLogsHandler).Methods("GET")
	r.HandleFunc("/api/backups/{backupId}/logs", getBackupLogsHandler).Methods("GET")

	// Schedule routes
	r.HandleFunc("/api/schedules", getSchedulesHandler).Methods("GET")
	r.HandleFunc("/api/devices/{deviceId}/schedule", getDeviceScheduleHandler).Methods("GET")
	r.HandleFunc("/api/schedules", updateScheduleHandler).Methods("POST")

	// Server status route
	r.HandleFunc("/api/server/status", getServerStatusHandler).Methods("GET")

	// Set up CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})
	handler := c.Handler(r)

	// Start server
	fmt.Println("Server is running on port 8000...")
	log.Fatal(http.ListenAndServe(":8000", handler))
}
