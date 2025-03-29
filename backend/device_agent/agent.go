package main

import (
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// Configuration
type Config struct {
	DeviceID      string `json:"deviceId"`
	DeviceName    string `json:"deviceName"`
	ServerURL     string `json:"serverUrl"`
	BackupDir     string `json:"backupDir"`
	LocalStorageDir string `json:"localStorageDir"`
	IntervalMinutes int    `json:"intervalMinutes"`
}

// Status response
type StatusResponse struct {
	Status string `json:"status"`
}

var (
	configFile = flag.String("config", "config.json", "Path to configuration file")
	config     Config
	logger     *log.Logger
)

func init() {
	// Set up logging
	logFile, err := os.OpenFile("agent.log", os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		log.Fatalf("Failed to open log file: %s", err)
	}
	
	logger = log.New(io.MultiWriter(os.Stdout, logFile), "[BACKUP-AGENT] ", log.LstdFlags)
}

func loadConfig() error {
	flag.Parse()
	
	data, err := os.ReadFile(*configFile)
	if err != nil {
		return fmt.Errorf("failed to read config file: %s", err)
	}
	
	if err := json.Unmarshal(data, &config); err != nil {
		return fmt.Errorf("failed to parse config file: %s", err)
	}
	
	// Validate config
	if config.DeviceID == "" {
		return fmt.Errorf("deviceId is required in config")
	}
	if config.ServerURL == "" {
		return fmt.Errorf("serverUrl is required in config")
	}
	if config.BackupDir == "" {
		// Use default backup directory if not specified
		homeDir, err := os.UserHomeDir()
		if err != nil {
			return fmt.Errorf("failed to get user home directory: %s", err)
		}
		config.BackupDir = filepath.Join(homeDir, "backups")
	}
	if config.LocalStorageDir == "" {
		config.LocalStorageDir = filepath.Join(config.BackupDir, "local")
	}
	if config.IntervalMinutes <= 0 {
		config.IntervalMinutes = 60 // Default to hourly
	}
	
	return nil
}

func createBackupDirs() error {
	if err := os.MkdirAll(config.BackupDir, 0755); err != nil {
		return fmt.Errorf("failed to create backup directory: %s", err)
	}
	
	if err := os.MkdirAll(config.LocalStorageDir, 0755); err != nil {
		return fmt.Errorf("failed to create local storage directory: %s", err)
	}
	
	return nil
}

func getSystemInfo() (string, int64, int64, error) {
	// Get OS version
	osVersionCmd := exec.Command("uname", "-a")
	osVersionOutput, err := osVersionCmd.Output()
	if err != nil {
		return "", 0, 0, fmt.Errorf("failed to get OS version: %s", err)
	}
	osVersion := strings.TrimSpace(string(osVersionOutput))
	
	// Get storage info
	dfCmd := exec.Command("df", "-B1", "/")
	dfOutput, err := dfCmd.Output()
	if err != nil {
		return osVersion, 0, 0, fmt.Errorf("failed to get storage info: %s", err)
	}
	
	// Parse df output
	dfLines := strings.Split(string(dfOutput), "\n")
	if len(dfLines) < 2 {
		return osVersion, 0, 0, fmt.Errorf("unexpected df output format")
	}
	
	dfFields := strings.Fields(dfLines[1])
	if len(dfFields) < 4 {
		return osVersion, 0, 0, fmt.Errorf("unexpected df output format")
	}
	
	totalStorage, err := parseInt64(dfFields[1])
	if err != nil {
		return osVersion, 0, 0, fmt.Errorf("failed to parse total storage: %s", err)
	}
	
	usedStorage, err := parseInt64(dfFields[2])
	if err != nil {
		return osVersion, 0, 0, fmt.Errorf("failed to parse used storage: %s", err)
	}
	
	return osVersion, totalStorage, usedStorage, nil
}

func parseInt64(s string) (int64, error) {
	var result int64
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}

func pingServer() bool {
	resp, err := http.Get(fmt.Sprintf("%s/api/devices/%s", config.ServerURL, config.DeviceID))
	if err != nil {
		logger.Printf("Failed to connect to server: %s", err)
		return false
	}
	defer resp.Body.Close()
	
	return resp.StatusCode == http.StatusOK
}

func createBackup() (string, int64, int, error) {
	timestamp := time.Now().Format("20060102-150405")
	backupID := fmt.Sprintf("backup-%s-%s", config.DeviceID, timestamp)
	backupPath := filepath.Join(config.LocalStorageDir, backupID+".tar.gz")
	
	// Create tar.gz backup of important directories
	// In a real implementation, this would be more sophisticated and configurable
	cmd := exec.Command("tar", "-czf", backupPath, "/etc", "/var/log")
	
	logger.Printf("Creating backup: %s", backupPath)
	
	if err := cmd.Run(); err != nil {
		return "", 0, 0, fmt.Errorf("backup command failed: %s", err)
	}
	
	// Get backup info
	fileInfo, err := os.Stat(backupPath)
	if err != nil {
		return backupID, 0, 0, fmt.Errorf("failed to get backup file info: %s", err)
	}
	
	size := fileInfo.Size()
	
	// Count files in the archive
	listCmd := exec.Command("tar", "-tzf", backupPath)
	listOutput, err := listCmd.Output()
	if err != nil {
		return backupID, size, 0, fmt.Errorf("failed to list backup contents: %s", err)
	}
	
	fileCount := len(strings.Split(string(listOutput), "\n")) - 1
	
	logger.Printf("Backup created: %s (size: %d bytes, files: %d)", backupPath, size, fileCount)
	
	return backupID, size, fileCount, nil
}

func uploadBackup(backupID string, size int64, fileCount int) error {
	backupPath := filepath.Join(config.LocalStorageDir, backupID+".tar.gz")
	
	// Check if file exists
	if _, err := os.Stat(backupPath); os.IsNotExist(err) {
		return fmt.Errorf("backup file not found: %s", backupPath)
	}
	
	// In a real implementation, we would upload the actual file here
	// For this example, we'll just notify the server about the backup
	
	type BackupNotification struct {
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
	
	notification := BackupNotification{
		ID:         backupID,
		DeviceID:   config.DeviceID,
		DeviceName: config.DeviceName,
		Timestamp:  time.Now(),
		Size:       size,
		Status:     "completed",
		Location:   "both", // Assuming successful upload to server
		Type:       "scheduled",
		Version:    "1.0.0",
		Files:      fileCount,
	}
	
	jsonData, err := json.Marshal(notification)
	if err != nil {
		return fmt.Errorf("failed to marshal backup notification: %s", err)
	}
	
	resp, err := http.Post(
		fmt.Sprintf("%s/api/backups", config.ServerURL),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return fmt.Errorf("failed to send backup notification: %s", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("server returned error: %s", string(body))
	}
	
	logger.Printf("Backup %s uploaded to server", backupID)
	return nil
}

func performBackup() error {
	logger.Println("Starting backup process...")
	
	// Notify server that backup is starting
	// This would be a more sophisticated status update in a real implementation
	
	// Create backup
	backupID, size, fileCount, err := createBackup()
	if err != nil {
		logger.Printf("Backup failed: %s", err)
		return err
	}
	
	// Upload backup to server
	if err := uploadBackup(backupID, size, fileCount); err != nil {
		logger.Printf("Upload failed: %s", err)
		return err
	}
	
	logger.Println("Backup process completed successfully")
	return nil
}

func backupRoutine() {
	for {
		if pingServer() {
			if err := performBackup(); err != nil {
				logger.Printf("Backup routine failed: %s", err)
			}
		} else {
			logger.Println("Server is not reachable, skipping backup")
		}
		
		// Wait for next interval
		logger.Printf("Next backup in %d minutes", config.IntervalMinutes)
		time.Sleep(time.Duration(config.IntervalMinutes) * time.Minute)
	}
}

func main() {
	if err := loadConfig(); err != nil {
		logger.Fatalf("Failed to load configuration: %s", err)
	}
	
	logger.Printf("Starting backup agent for device: %s", config.DeviceName)
	logger.Printf("Server URL: %s", config.ServerURL)
	logger.Printf("Backup interval: %d minutes", config.IntervalMinutes)
	
	if err := createBackupDirs(); err != nil {
		logger.Fatalf("Failed to create backup directories: %s", err)
	}
	
	osVersion, totalStorage, usedStorage, err := getSystemInfo()
	if err != nil {
		logger.Printf("Failed to get system info: %s", err)
	} else {
		logger.Printf("OS Version: %s", osVersion)
		logger.Printf("Storage: %d/%d bytes (%.1f%% used)", 
			usedStorage, totalStorage, float64(usedStorage)/float64(totalStorage)*100)
	}
	
	// Start backup routine in a goroutine
	go backupRoutine()
	
	// In a real implementation, we might have a simple API server here
	// to receive commands from the central server
	
	// For now, just keep the program running
	select {}
}
