// Global app state
let appState = {
    currentScreen: 'welcome',
    userRole: null,
    currentClass: null,
    sessionActive: false,
    sessionStartTime: null,
    connectedStudents: [],
    sharedContent: [],
    sharedFiles: [],
    activePoll: null,
    connectionQuality: 'good',
    dataSaved: 78,
    selectedPollOption: null,
    sessionTimer: null,
    mediaRecorder: null,
    audioChunks: [],
    isRecording: false,
    recordingStartTime: null,
    recordingTimer: null,
    audioContext: null,
    analyser: null,
    dataArray: null,
    waveformAnimation: null,
    currentRecording: null
};

// App data
const appData = {
    subjects: ["Computer Science", "Mathematics", "Physics", "Chemistry", "Electronics", "Mechanical Engineering", "Civil Engineering", "Artificial Intelligence", "VLSI Design", "Renewable Energy"],
    sample_students: ["Priya", "Rahul", "Anita", "Vikash", "Sita", "Arjun", "Maya", "Ravi"]
};

// Utility functions
function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with id '${id}' not found`);
    }
    return element;
}

function generateClassCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function showNotification(message, type = 'success') {
    const notification = getElement('notification');
    const messageEl = getElement('notification-message');
    
    if (notification && messageEl) {
        messageEl.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 5000);
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    initializeApp();
    setupEventListeners();
    updateConnectionStatus();
    
    setInterval(updateConnectionStatus, 10000);
});

function initializeApp() {
    console.log('Initializing app...');
    showScreen('welcome');
    loadActiveSessions();
    populateOfflineContent();
    updateDataUsage();
    
    // Check for microphone permission
    checkMicrophonePermission();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Role selection
    const teacherRoleBtn = getElement('teacher-role');
    const studentRoleBtn = getElement('student-role');
    
    if (teacherRoleBtn) {
        teacherRoleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Teacher role selected');
            selectRole('teacher');
        });
    }
    
    if (studentRoleBtn) {
        studentRoleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Student role selected');
            selectRole('student');
        });
    }
    
    // Navigation
    const backToHomeBtn = getElement('back-to-home');
    const backToHomeStudentBtn = getElement('back-to-home-student');
    
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetApp();
        });
    }
    
    if (backToHomeStudentBtn) {
        backToHomeStudentBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetApp();
        });
    }
    
    // Quick join
    const quickJoinBtn = getElement('quick-join-btn');
    const quickJoinCode = getElement('quick-join-code');
    
    if (quickJoinBtn) {
        quickJoinBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Quick join clicked');
            quickJoinClass();
        });
    }
    
    if (quickJoinCode) {
        quickJoinCode.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                quickJoinClass();
            }
        });
        quickJoinCode.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
    
    // Teacher controls
    const startSessionBtn = getElement('start-session');
    const endSessionBtn = getElement('end-session');
    const copyCodeBtn = getElement('copy-code');
    
    if (startSessionBtn) {
        startSessionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Start session clicked');
            startSession();
        });
    }
    
    if (endSessionBtn) {
        endSessionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('End session clicked');
            endSession();
        });
    }
    
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            copyClassCode();
        });
    }
    
    // Audio recording controls
    const startRecordingBtn = getElement('start-recording');
    const stopRecordingBtn = getElement('stop-recording');
    const playRecordingBtn = getElement('play-recording');
    const downloadRecordingBtn = getElement('download-recording');
    
    if (startRecordingBtn) {
        startRecordingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            startAudioRecording();
        });
    }
    
    if (stopRecordingBtn) {
        stopRecordingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            stopAudioRecording();
        });
    }
    
    if (playRecordingBtn) {
        playRecordingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            playRecording();
        });
    }
    
    if (downloadRecordingBtn) {
        downloadRecordingBtn.addEventListener('click', function(e) {
            e.preventDefault();
            downloadRecording();
        });
    }
    
    // File upload - Fix the functionality
    const uploadFilesBtn = getElement('upload-files-btn');
    const fileInput = getElement('file-input');
    
    if (uploadFilesBtn && fileInput) {
        uploadFilesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('File upload button clicked');
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function(e) {
            console.log('Files selected:', e.target.files);
            handleFileUpload();
        });
    }
    
    // Content sharing
    const shareTextBtn = getElement('share-text');
    const createPollBtn = getElement('create-poll');
    
    if (shareTextBtn) {
        shareTextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showModal('text-modal');
        });
    }
    
    if (createPollBtn) {
        createPollBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showModal('poll-modal');
        });
    }
    
    // Student controls
    const joinClassBtn = getElement('join-class-btn');
    const classCodeInput = getElement('class-code-input');
    const raiseHandBtn = getElement('raise-hand');
    const askQuestionBtn = getElement('ask-question');
    const leaveClassBtn = getElement('leave-class');
    
    if (joinClassBtn) {
        joinClassBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Join class button clicked');
            joinClass();
        });
    }
    
    if (classCodeInput) {
        classCodeInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                joinClass();
            }
        });
        classCodeInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.toUpperCase();
        });
    }
    
    if (raiseHandBtn) {
        raiseHandBtn.addEventListener('click', function(e) {
            e.preventDefault();
            raiseHand();
        });
    }
    
    if (askQuestionBtn) {
        askQuestionBtn.addEventListener('click', function(e) {
            e.preventDefault();
            askQuestion();
        });
    }
    
    if (leaveClassBtn) {
        leaveClassBtn.addEventListener('click', function(e) {
            e.preventDefault();
            leaveClass();
        });
    }
    
    // Modal controls
    setupModalListeners();
    
    // Audio quality
    const audioQuality = getElement('audio-quality');
    if (audioQuality) {
        audioQuality.addEventListener('change', function() {
            updateAudioQuality();
        });
    }
    
    // Notification close
    const notificationClose = getElement('notification-close');
    if (notificationClose) {
        notificationClose.addEventListener('click', function() {
            const notification = getElement('notification');
            if (notification) {
                notification.classList.add('hidden');
            }
        });
    }
}

function setupModalListeners() {
    // Poll modal
    const closePollModalBtn = getElement('close-poll-modal');
    const createPollModalBtn = getElement('create-poll-btn');
    
    if (closePollModalBtn) {
        closePollModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal('poll-modal');
        });
    }
    
    if (createPollModalBtn) {
        createPollModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            createPoll();
        });
    }
    
    // Text modal
    const closeTextModalBtn = getElement('close-text-modal');
    const shareTextModalBtn = getElement('share-text-btn');
    
    if (closeTextModalBtn) {
        closeTextModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            hideModal('text-modal');
        });
    }
    
    if (shareTextModalBtn) {
        shareTextModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            shareTextContent();
        });
    }
    
    // Poll answer
    const submitPollAnswerBtn = getElement('submit-poll-answer');
    if (submitPollAnswerBtn) {
        submitPollAnswerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            submitPollAnswer();
        });
    }
}

// Screen management
function showScreen(screenId) {
    console.log(`Showing screen: ${screenId}`);
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = getElement(screenId + '-screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        appState.currentScreen = screenId;
        console.log(`Successfully switched to ${screenId} screen`);
    } else {
        console.error(`Screen ${screenId} not found`);
    }
}

function selectRole(role) {
    console.log(`Role selected: ${role}`);
    appState.userRole = role;
    
    if (role === 'teacher') {
        showScreen('teacher');
        const classCode = generateClassCode();
        const codeElement = getElement('current-class-code');
        if (codeElement) {
            codeElement.textContent = classCode;
        }
        appState.currentClass = { 
            code: classCode, 
            teacher: 'You',
            subject: 'Live Class',
            title: 'Live Teaching Session',
            startTime: new Date().toISOString(),
            status: 'waiting',
            students: [],
            sharedFiles: [],
            recordings: [],
            createdAt: new Date().toISOString()
        };
        console.log(`Generated class code: ${classCode}`);
    } else if (role === 'student') {
        showScreen('student');
        loadActiveSessions();
        console.log('Student screen loaded');
    }
}

function resetApp() {
    console.log('Resetting app...');
    
    // Stop any active recording
    if (appState.isRecording) {
        stopAudioRecording();
    }
    
    // Clear timers
    if (appState.sessionTimer) {
        clearInterval(appState.sessionTimer);
        appState.sessionTimer = null;
    }
    
    if (appState.recordingTimer) {
        clearInterval(appState.recordingTimer);
        appState.recordingTimer = null;
    }
    
    // Clean up session if teacher
    if (appState.userRole === 'teacher' && appState.currentClass) {
        cleanupSession(appState.currentClass.code);
    }
    
    // Reset state
    appState.userRole = null;
    appState.currentClass = null;
    appState.sessionActive = false;
    appState.connectedStudents = [];
    appState.sharedContent = [];
    appState.sharedFiles = [];
    appState.activePoll = null;
    appState.selectedPollOption = null;
    appState.currentRecording = null;
    
    // Reset UI
    resetUI();
    showScreen('welcome');
}

function resetUI() {
    // Reset buttons
    const startBtn = getElement('start-session');
    const endBtn = getElement('end-session');
    const audioSection = getElement('audio-recording-section');
    const activeClassCard = getElement('active-class-card');
    const joinError = getElement('join-error');
    
    if (startBtn) startBtn.classList.remove('hidden');
    if (endBtn) endBtn.classList.add('hidden');
    if (audioSection) audioSection.classList.add('hidden');
    if (activeClassCard) activeClassCard.classList.add('hidden');
    if (joinError) joinError.classList.add('hidden');
    
    // Clear inputs
    const inputs = ['quick-join-code', 'class-code-input'];
    inputs.forEach(id => {
        const input = getElement(id);
        if (input) input.value = '';
    });
    
    // Update displays
    updateSharedContent();
    updateSharedFiles();
}

// Connection status
function updateConnectionStatus() {
    const qualities = ['good', 'fair', 'poor'];
    const bandwidths = ['High (256 kbps)', 'Medium (128 kbps)', 'Low (64 kbps)'];
    
    const qualityIndex = Math.floor(Math.random() * 3);
    appState.connectionQuality = qualities[qualityIndex];
    
    const indicator = getElement('connection-indicator');
    const statusText = getElement('bandwidth-status');
    
    if (indicator) {
        indicator.className = 'status-indicator';
        if (appState.connectionQuality === 'poor') {
            indicator.classList.add('poor');
            if (statusText) statusText.textContent = bandwidths[2];
        } else if (appState.connectionQuality === 'fair') {
            indicator.classList.add('fair');
            if (statusText) statusText.textContent = bandwidths[1];
        } else {
            if (statusText) statusText.textContent = bandwidths[0];
        }
    }
}

// Session management using localStorage with fallback
function saveSession(session) {
    try {
        // Use both localStorage and in-memory storage for reliability
        const sessions = JSON.parse(localStorage.getItem('ruralClassrooms_sessions') || '{}');
        sessions[session.code] = session;
        localStorage.setItem('ruralClassrooms_sessions', JSON.stringify(sessions));
        
        // Also store in window for immediate access
        if (!window.ruralClassroomSessions) {
            window.ruralClassroomSessions = {};
        }
        window.ruralClassroomSessions[session.code] = session;
        
        console.log(`Session saved: ${session.code}`);
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        // Fallback: just keep in memory
        if (!window.ruralClassroomSessions) {
            window.ruralClassroomSessions = {};
        }
        window.ruralClassroomSessions[session.code] = session;
    }
}

function loadSession(code) {
    try {
        // Try memory first, then localStorage
        if (window.ruralClassroomSessions && window.ruralClassroomSessions[code]) {
            return window.ruralClassroomSessions[code];
        }
        
        const sessions = JSON.parse(localStorage.getItem('ruralClassrooms_sessions') || '{}');
        return sessions[code] || null;
    } catch (error) {
        console.error('Failed to load session:', error);
        // Fallback to memory
        if (window.ruralClassroomSessions && window.ruralClassroomSessions[code]) {
            return window.ruralClassroomSessions[code];
        }
        return null;
    }
}

function loadActiveSessions() {
    try {
        let sessions = {};
        
        // Try to get from memory first
        if (window.ruralClassroomSessions) {
            sessions = { ...window.ruralClassroomSessions };
        } else {
            // Try localStorage
            sessions = JSON.parse(localStorage.getItem('ruralClassrooms_sessions') || '{}');
        }
        
        const activeSessions = Object.values(sessions).filter(s => s.status === 'active');
        displayActiveSessions(activeSessions);
    } catch (error) {
        console.error('Failed to load active sessions:', error);
        displayActiveSessions([]);
    }
}

function cleanupSession(code) {
    try {
        // Remove from localStorage
        const sessions = JSON.parse(localStorage.getItem('ruralClassrooms_sessions') || '{}');
        delete sessions[code];
        localStorage.setItem('ruralClassrooms_sessions', JSON.stringify(sessions));
        
        // Remove from memory
        if (window.ruralClassroomSessions && window.ruralClassroomSessions[code]) {
            delete window.ruralClassroomSessions[code];
        }
        
        console.log(`Session cleaned up: ${code}`);
    } catch (error) {
        console.error('Failed to cleanup session:', error);
    }
}

function displayActiveSessions(sessions) {
    const liveClassesList = getElement('live-classes-list');
    if (!liveClassesList) return;
    
    if (sessions.length === 0) {
        liveClassesList.innerHTML = '<p class="text-secondary">No active classes at the moment</p>';
        return;
    }
    
    const html = sessions.map(session => `
        <div class="live-class-item">
            <div class="class-info">
                <h5>${session.title}</h5>
                <div class="class-meta">${session.teacher} • ${session.students.length} students</div>
            </div>
            <div class="class-actions">
                <span class="status status--live">LIVE</span>
                <button class="btn btn--sm btn--primary" onclick="joinClassWithCode('${session.code}')">Join</button>
            </div>
        </div>
    `).join('');
    
    liveClassesList.innerHTML = html;
}

// Session control
function startSession() {
    if (!appState.currentClass) {
        console.error('No current class to start');
        return;
    }
    
    console.log('Starting session...');
    appState.sessionActive = true;
    appState.sessionStartTime = Date.now();
    appState.currentClass.status = 'active';
    appState.currentClass.startTime = new Date().toISOString();
    
    // Save session
    saveSession(appState.currentClass);
    
    // Update UI
    const startBtn = getElement('start-session');
    const endBtn = getElement('end-session');
    const audioSection = getElement('audio-recording-section');
    const sessionStatus = getElement('session-status');
    
    if (startBtn) startBtn.classList.add('hidden');
    if (endBtn) endBtn.classList.remove('hidden');
    if (audioSection) audioSection.classList.remove('hidden');
    if (sessionStatus) sessionStatus.textContent = 'Live';
    
    // Start timers
    updateSessionDuration();
    appState.sessionTimer = setInterval(updateSessionDuration, 1000);
    
    // Simulate students joining
    simulateStudentsJoining();
    
    showNotification('Live class started successfully!', 'success');
    console.log('Session started successfully');
}

function endSession() {
    if (!appState.currentClass) return;
    
    console.log('Ending session...');
    appState.sessionActive = false;
    
    // Stop recording if active
    if (appState.isRecording) {
        stopAudioRecording();
    }
    
    // Clean up session
    cleanupSession(appState.currentClass.code);
    
    // Update UI
    const startBtn = getElement('start-session');
    const endBtn = getElement('end-session');
    const audioSection = getElement('audio-recording-section');
    const sessionStatus = getElement('session-status');
    
    if (startBtn) startBtn.classList.remove('hidden');
    if (endBtn) endBtn.classList.add('hidden');
    if (audioSection) audioSection.classList.add('hidden');
    if (sessionStatus) sessionStatus.textContent = 'Ended';
    
    // Clear timers
    if (appState.sessionTimer) {
        clearInterval(appState.sessionTimer);
        appState.sessionTimer = null;
    }
    
    // Reset students
    appState.connectedStudents = [];
    updateStudentList();
    
    const connectedStudentsEl = getElement('connected-students');
    if (connectedStudentsEl) {
        connectedStudentsEl.textContent = '0';
    }
    
    showNotification('Class session ended', 'success');
}

function updateSessionDuration() {
    if (!appState.sessionStartTime) return;
    
    const elapsed = Math.floor((Date.now() - appState.sessionStartTime) / 1000);
    const durationEl = getElement('session-duration');
    if (durationEl) {
        durationEl.textContent = formatDuration(elapsed);
    }
}

function simulateStudentsJoining() {
    let studentCount = 0;
    
    const joinInterval = setInterval(() => {
        if (studentCount >= 6 || !appState.sessionActive) {
            clearInterval(joinInterval);
            return;
        }
        
        const student = {
            id: studentCount,
            name: appData.sample_students[studentCount],
            status: 'online',
            joinedAt: Date.now()
        };
        
        appState.connectedStudents.push(student);
        if (appState.currentClass) {
            appState.currentClass.students.push(student);
            saveSession(appState.currentClass);
        }
        
        studentCount++;
        
        const connectedStudentsEl = getElement('connected-students');
        if (connectedStudentsEl) {
            connectedStudentsEl.textContent = studentCount.toString();
        }
        updateStudentList();
    }, 2000 + Math.random() * 3000);
}

function updateStudentList() {
    const studentList = getElement('student-list');
    if (!studentList) return;
    
    if (appState.connectedStudents.length === 0) {
        studentList.innerHTML = '<p class="text-secondary">No students connected</p>';
        return;
    }
    
    const html = appState.connectedStudents.map(student => `
        <div class="student-item">
            <span class="student-name">${student.name}</span>
            <span class="student-status ${student.status}">${student.status}</span>
        </div>
    `).join('');
    
    studentList.innerHTML = html;
}

function copyClassCode() {
    if (!appState.currentClass) return;
    
    const code = appState.currentClass.code;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            showNotification('Class code copied to clipboard!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(code);
        });
    } else {
        fallbackCopyTextToClipboard(code);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Class code copied!', 'success');
        } else {
            showNotification('Failed to copy class code', 'error');
        }
    } catch (err) {
        showNotification('Failed to copy class code', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Audio recording functionality
function checkMicrophonePermission() {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getTracks().forEach(track => track.stop());
                console.log('Microphone permission granted');
            })
            .catch(error => {
                console.warn('Microphone permission denied:', error);
            });
    }
}

async function startAudioRecording() {
    try {
        const constraints = {
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set up audio context for waveform
        appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        appState.analyser = appState.audioContext.createAnalyser();
        const source = appState.audioContext.createMediaStreamSource(stream);
        source.connect(appState.analyser);
        
        appState.analyser.fftSize = 256;
        const bufferLength = appState.analyser.frequencyBinCount;
        appState.dataArray = new Uint8Array(bufferLength);
        
        // Set up MediaRecorder
        const qualitySelect = getElement('audio-quality');
        const bitrate = qualitySelect ? parseInt(qualitySelect.value) : 64000;
        
        const options = {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: bitrate
        };
        
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options.mimeType = 'audio/webm';
        }
        
        appState.mediaRecorder = new MediaRecorder(stream, options);
        appState.audioChunks = [];
        
        appState.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                appState.audioChunks.push(event.data);
            }
        };
        
        appState.mediaRecorder.onstop = () => {
            const blob = new Blob(appState.audioChunks, { type: 'audio/webm' });
            appState.currentRecording = {
                blob: blob,
                url: URL.createObjectURL(blob),
                duration: Math.floor((Date.now() - appState.recordingStartTime) / 1000),
                size: blob.size,
                timestamp: new Date().toISOString()
            };
            
            // Stop audio context
            if (appState.audioContext) {
                appState.audioContext.close();
                appState.audioContext = null;
            }
            
            // Stop all tracks
            stream.getTracks().forEach(track => track.stop());
            
            updateRecordingUI();
        };
        
        // Start recording
        appState.mediaRecorder.start(1000);
        appState.isRecording = true;
        appState.recordingStartTime = Date.now();
        
        // Update UI
        const startBtn = getElement('start-recording');
        const stopBtn = getElement('stop-recording');
        const recordingStatus = getElement('recording-status');
        const waveform = getElement('audio-waveform');
        
        if (startBtn) startBtn.classList.add('hidden');
        if (stopBtn) stopBtn.classList.remove('hidden');
        if (recordingStatus) recordingStatus.classList.remove('hidden');
        if (waveform) waveform.classList.remove('hidden');
        
        // Start recording timer and waveform
        updateRecordingDuration();
        appState.recordingTimer = setInterval(updateRecordingDuration, 1000);
        drawWaveform();
        
        showNotification('Recording started', 'success');
        
    } catch (error) {
        console.error('Error starting recording:', error);
        showNotification('Failed to start recording. Please check microphone permissions.', 'error');
    }
}

function stopAudioRecording() {
    if (!appState.mediaRecorder || !appState.isRecording) return;
    
    appState.mediaRecorder.stop();
    appState.isRecording = false;
    
    // Clear timer
    if (appState.recordingTimer) {
        clearInterval(appState.recordingTimer);
        appState.recordingTimer = null;
    }
    
    // Stop waveform animation
    if (appState.waveformAnimation) {
        cancelAnimationFrame(appState.waveformAnimation);
        appState.waveformAnimation = null;
    }
    
    // Update UI
    const startBtn = getElement('start-recording');
    const stopBtn = getElement('stop-recording');
    const recordingStatus = getElement('recording-status');
    
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (recordingStatus) recordingStatus.classList.add('hidden');
    
    showNotification('Recording stopped', 'success');
}

function updateRecordingDuration() {
    if (!appState.recordingStartTime) return;
    
    const elapsed = Math.floor((Date.now() - appState.recordingStartTime) / 1000);
    const durationEl = getElement('recording-duration');
    const sizeEl = getElement('recording-size');
    
    if (durationEl) {
        durationEl.textContent = formatDuration(elapsed);
    }
    
    if (sizeEl && appState.audioChunks.length > 0) {
        const totalSize = appState.audioChunks.reduce((total, chunk) => total + chunk.size, 0);
        sizeEl.textContent = formatFileSize(totalSize);
    }
}

function updateRecordingUI() {
    const playBtn = getElement('play-recording');
    const downloadBtn = getElement('download-recording');
    const waveform = getElement('audio-waveform');
    
    if (playBtn) playBtn.classList.remove('hidden');
    if (downloadBtn) downloadBtn.classList.remove('hidden');
    if (waveform) waveform.classList.add('hidden');
    
    // Add to shared content if in session
    if (appState.sessionActive && appState.currentRecording) {
        const recording = {
            id: Date.now(),
            type: 'audio',
            title: `Recording ${new Date().toLocaleTimeString()}`,
            url: appState.currentRecording.url,
            duration: appState.currentRecording.duration,
            size: appState.currentRecording.size,
            timestamp: appState.currentRecording.timestamp
        };
        
        appState.sharedContent.push(recording);
        if (appState.currentClass) {
            appState.currentClass.recordings = appState.currentClass.recordings || [];
            appState.currentClass.recordings.push(recording);
            saveSession(appState.currentClass);
        }
        
        updateSharedContent();
        updateAudioPlayback();
    }
}

function drawWaveform() {
    if (!appState.isRecording || !appState.analyser || !appState.dataArray) return;
    
    const canvas = getElement('waveform-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    appState.analyser.getByteFrequencyData(appState.dataArray);
    
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-background');
    ctx.fillRect(0, 0, width, height);
    
    const barWidth = (width / appState.dataArray.length) * 2.5;
    let barHeight;
    let x = 0;
    
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-primary');
    
    for (let i = 0; i < appState.dataArray.length; i++) {
        barHeight = (appState.dataArray[i] / 255) * height;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
    
    appState.waveformAnimation = requestAnimationFrame(drawWaveform);
}

function playRecording() {
    if (!appState.currentRecording) return;
    
    const audio = new Audio(appState.currentRecording.url);
    audio.play().catch(error => {
        console.error('Error playing recording:', error);
        showNotification('Error playing recording', 'error');
    });
}

function downloadRecording() {
    if (!appState.currentRecording) return;
    
    const link = document.createElement('a');
    link.href = appState.currentRecording.url;
    link.download = `recording_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Recording downloaded', 'success');
}

// File handling - Fixed implementation
function handleFileUpload() {
    const fileInput = getElement('file-input');
    if (!fileInput || !fileInput.files.length) return;
    
    const files = Array.from(fileInput.files);
    const maxSize = 10 * 1024 * 1024; // 10MB limit for rural connections
    
    files.forEach(file => {
        if (file.size > maxSize) {
            showNotification(`File ${file.name} is too large (max 10MB)`, 'error');
            return;
        }
        
        const fileObj = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            timestamp: new Date().toISOString()
        };
        
        appState.sharedFiles.push(fileObj);
        
        if (appState.currentClass) {
            appState.currentClass.sharedFiles.push(fileObj);
            saveSession(appState.currentClass);
        }
        
        showNotification(`File ${file.name} shared successfully`, 'success');
    });
    
    updateSharedFiles();
    fileInput.value = '';
}

function updateSharedFiles() {
    const filesList = getElement('files-list');
    const studentFilesList = getElement('student-files-list');
    
    if (appState.sharedFiles.length === 0) {
        const emptyMsg = '<p class="text-secondary">No files shared yet</p>';
        if (filesList) filesList.innerHTML = emptyMsg;
        if (studentFilesList) studentFilesList.innerHTML = emptyMsg;
        return;
    }
    
    const html = appState.sharedFiles.map(file => `
        <div class="file-item">
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-meta">${formatFileSize(file.size)} • ${new Date(file.timestamp).toLocaleTimeString()}</div>
            </div>
            <div class="file-actions">
                <button class="btn btn--sm btn--outline" onclick="downloadFile('${file.id}')">Download</button>
            </div>
        </div>
    `).join('');
    
    if (filesList) filesList.innerHTML = html;
    if (studentFilesList) studentFilesList.innerHTML = html;
}

function downloadFile(fileId) {
    const file = appState.sharedFiles.find(f => f.id == fileId);
    if (!file) return;
    
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Downloaded ${file.name}`, 'success');
}

// Class joining - Fixed implementation
function quickJoinClass() {
    const codeInput = getElement('quick-join-code');
    if (!codeInput) return;
    
    const code = codeInput.value.trim().toUpperCase();
    console.log(`Quick join attempted with code: ${code}`);
    
    if (code.length !== 6) {
        showNotification('Please enter a valid 6-character class code', 'error');
        return;
    }
    
    // Set role to student and switch to student screen
    appState.userRole = 'student';
    showScreen('student');
    
    // Auto-populate the class code input and attempt to join
    setTimeout(() => {
        const classCodeInput = getElement('class-code-input');
        if (classCodeInput) {
            classCodeInput.value = code;
        }
        joinClassWithCode(code);
    }, 100);
}

function joinClass() {
    const codeInput = getElement('class-code-input');
    if (!codeInput) return;
    
    const code = codeInput.value.trim().toUpperCase();
    console.log(`Join class attempted with code: ${code}`);
    joinClassWithCode(code);
}

function joinClassWithCode(code) {
    console.log(`Attempting to join class: ${code}`);
    
    if (code.length !== 6) {
        showJoinError('Please enter a valid 6-character class code');
        return;
    }
    
    const session = loadSession(code);
    console.log(`Session found for code ${code}:`, session);
    
    if (!session || session.status !== 'active') {
        showJoinError('Class not found. Please check the code and try again.');
        return;
    }
    
    // Successfully join class
    hideJoinError();
    appState.currentClass = session;
    
    // Update UI - Show active class card and populate data
    const activeTitleEl = getElement('active-class-title');
    const activeClassCard = getElement('active-class-card');
    const audioIndicator = getElement('audio-indicator');
    const audioStatus = getElement('audio-status');
    const activeTeacher = getElement('active-teacher');
    const activeSubject = getElement('active-subject');
    const classStudentCount = getElement('class-student-count');
    
    if (activeTitleEl) activeTitleEl.textContent = session.title;
    if (activeTeacher) activeTeacher.textContent = session.teacher;
    if (activeSubject) activeSubject.textContent = session.subject;
    if (classStudentCount) classStudentCount.textContent = session.students.length;
    if (activeClassCard) activeClassCard.classList.remove('hidden');
    if (audioIndicator) audioIndicator.classList.add('connecting');
    if (audioStatus) audioStatus.textContent = 'Connecting...';
    
    // Load shared content
    appState.sharedFiles = session.sharedFiles || [];
    appState.sharedContent = session.recordings || [];
    updateSharedFiles();
    updateSharedContent();
    updateAudioPlayback();
    
    // Simulate connection
    setTimeout(() => {
        if (audioIndicator) audioIndicator.classList.remove('connecting');
        if (audioStatus) audioStatus.textContent = 'Connected - Audio Active';
    }, 2000);
    
    // Clear input
    const classCodeInput = getElement('class-code-input');
    if (classCodeInput) classCodeInput.value = '';
    
    showNotification(`Joined ${session.title} successfully!`, 'success');
}

// Make joinClassWithCode globally available
window.joinClassWithCode = joinClassWithCode;

function showJoinError(message) {
    const errorEl = getElement('join-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }
}

function hideJoinError() {
    const errorEl = getElement('join-error');
    if (errorEl) {
        errorEl.classList.add('hidden');
    }
}

function updateAudioPlayback() {
    const audioPlayer = getElement('audio-player');
    if (!audioPlayer) return;
    
    const recordings = appState.sharedContent.filter(item => item.type === 'audio');
    
    if (recordings.length === 0) {
        audioPlayer.innerHTML = '<p class="text-secondary">No recordings available</p>';
        return;
    }
    
    const html = recordings.map(recording => `
        <div class="recording-item" style="margin-bottom: 12px;">
            <div style="margin-bottom: 8px; font-weight: 500;">${recording.title}</div>
            <audio controls style="width: 100%;">
                <source src="${recording.url}" type="audio/webm">
                Your browser does not support audio playback.
            </audio>
            <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 4px;">
                ${formatDuration(recording.duration)} • ${formatFileSize(recording.size)}
            </div>
        </div>
    `).join('');
    
    audioPlayer.innerHTML = html;
}

// Student actions - Fixed implementation
function raiseHand() {
    const button = getElement('raise-hand');
    if (!button) return;
    
    const isRaised = button.textContent.includes('Hand Raised');
    
    if (!isRaised) {
        button.classList.remove('btn--secondary');
        button.classList.add('btn--primary');
        button.textContent = '✋ Hand Raised';
        button.style.backgroundColor = 'var(--color-warning)';
        button.style.color = 'var(--color-text)';
        showNotification('Hand raised! Teacher will be notified.', 'success');
    } else {
        button.classList.add('btn--secondary');
        button.classList.remove('btn--primary');
        button.textContent = '✋ Raise Hand';
        button.style.backgroundColor = '';
        button.style.color = '';
        showNotification('Hand lowered', 'success');
    }
}

function askQuestion() {
    const question = prompt('Enter your question:');
    if (question && question.trim()) {
        showNotification('Question sent to teacher: ' + question, 'success');
    }
}

function leaveClass() {
    if (!confirm('Are you sure you want to leave the class?')) return;
    
    appState.currentClass = null;
    appState.sharedFiles = [];
    appState.sharedContent = [];
    
    const activeClassCard = getElement('active-class-card');
    const raiseHandBtn = getElement('raise-hand');
    
    if (activeClassCard) activeClassCard.classList.add('hidden');
    if (raiseHandBtn) {
        raiseHandBtn.classList.add('btn--secondary');
        raiseHandBtn.classList.remove('btn--primary');
        raiseHandBtn.textContent = '✋ Raise Hand';
        raiseHandBtn.style.backgroundColor = '';
        raiseHandBtn.style.color = '';
    }
    
    updateSharedFiles();
    updateSharedContent();
    updateAudioPlayback();
    
    showNotification('Left class successfully', 'success');
}

// Content sharing
function showModal(modalId) {
    const modal = getElement(modalId);
    if (modal) modal.classList.remove('hidden');
}

function hideModal(modalId) {
    const modal = getElement(modalId);
    if (modal) modal.classList.add('hidden');
}

function shareTextContent() {
    const titleInput = getElement('content-title');
    const contentInput = getElement('content-text');
    
    if (!titleInput || !contentInput) return;
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
        showNotification('Please fill in both title and content', 'error');
        return;
    }
    
    const sharedItem = {
        id: Date.now(),
        title: title,
        content: content,
        timestamp: new Date().toISOString(),
        type: 'text'
    };
    
    appState.sharedContent.push(sharedItem);
    
    if (appState.currentClass) {
        appState.currentClass.sharedContent = appState.currentClass.sharedContent || [];
        appState.currentClass.sharedContent.push(sharedItem);
        saveSession(appState.currentClass);
    }
    
    updateSharedContent();
    
    titleInput.value = '';
    contentInput.value = '';
    hideModal('text-modal');
    
    showNotification('Content shared successfully!', 'success');
}

function updateSharedContent() {
    const sharedContentEl = getElement('content-list');
    const contentDisplayEl = getElement('content-display');
    
    const textContent = appState.sharedContent.filter(item => item.type === 'text');
    
    if (textContent.length === 0) {
        const emptyMsg = '<p class="text-secondary">No content shared yet</p>';
        if (sharedContentEl) sharedContentEl.innerHTML = emptyMsg;
        if (contentDisplayEl) contentDisplayEl.innerHTML = emptyMsg;
        return;
    }
    
    const html = textContent.map(item => `
        <div class="shared-content-item">
            <div class="content-timestamp">${new Date(item.timestamp).toLocaleTimeString()}</div>
            <h6>${item.title}</h6>
            <p>${item.content}</p>
        </div>
    `).join('');
    
    if (sharedContentEl) sharedContentEl.innerHTML = html;
    if (contentDisplayEl) contentDisplayEl.innerHTML = html;
}

// Poll functionality
function createPoll() {
    const questionInput = getElement('poll-question');
    const optionAInput = getElement('option-a');
    const optionBInput = getElement('option-b');
    const optionCInput = getElement('option-c');
    const optionDInput = getElement('option-d');
    
    if (!questionInput || !optionAInput || !optionBInput) return;
    
    const question = questionInput.value.trim();
    const optionA = optionAInput.value.trim();
    const optionB = optionBInput.value.trim();
    const optionC = optionCInput.value.trim();
    const optionD = optionDInput.value.trim();
    
    if (!question || !optionA || !optionB) {
        showNotification('Please fill in at least the question and first two options', 'error');
        return;
    }
    
    const options = [optionA, optionB];
    if (optionC) options.push(optionC);
    if (optionD) options.push(optionD);
    
    appState.activePoll = {
        question: question,
        options: options,
        votes: new Array(options.length).fill(0),
        totalVotes: 0
    };
    
    // Clear form
    questionInput.value = '';
    optionAInput.value = '';
    optionBInput.value = '';
    optionCInput.value = '';
    optionDInput.value = '';
    hideModal('poll-modal');
    
    showNotification('Poll created and sent to students!', 'success');
    
    // Show poll to students (simulation)
    if (appState.userRole === 'student' && appState.currentClass) {
        setTimeout(() => showActivePoll(), 1000);
    }
}

function showActivePoll() {
    if (!appState.activePoll) return;
    
    const questionDisplay = getElement('poll-question-display');
    const optionsDisplay = getElement('poll-options-display');
    
    if (questionDisplay) {
        questionDisplay.textContent = appState.activePoll.question;
    }
    
    if (optionsDisplay) {
        const optionsHtml = appState.activePoll.options.map((option, index) => `
            <div class="poll-option" onclick="selectPollOption(${index})">
                <input type="radio" name="poll-answer" value="${index}" id="option-${index}">
                <label for="option-${index}">${option}</label>
            </div>
        `).join('');
        
        optionsDisplay.innerHTML = optionsHtml;
    }
    
    const submitBtn = getElement('submit-poll-answer');
    if (submitBtn) submitBtn.classList.remove('hidden');
    
    showModal('active-poll-modal');
}

function selectPollOption(index) {
    document.querySelectorAll('.poll-option').forEach((option, i) => {
        option.classList.toggle('selected', i === index);
    });
    const optionRadio = getElement(`option-${index}`);
    if (optionRadio) optionRadio.checked = true;
    appState.selectedPollOption = index;
}

// Make selectPollOption globally available
window.selectPollOption = selectPollOption;

function submitPollAnswer() {
    if (appState.selectedPollOption === null || appState.selectedPollOption === undefined) {
        showNotification('Please select an answer', 'error');
        return;
    }
    
    if (appState.activePoll) {
        appState.activePoll.votes[appState.selectedPollOption]++;
        appState.activePoll.totalVotes++;
        
        showPollResults();
        const submitBtn = getElement('submit-poll-answer');
        if (submitBtn) submitBtn.classList.add('hidden');
    }
}

function showPollResults() {
    if (!appState.activePoll) return;
    
    const resultsDisplay = getElement('poll-results-display');
    const resultsSection = getElement('poll-results');
    
    if (!resultsDisplay || !resultsSection) return;
    
    const resultsHtml = appState.activePoll.options.map((option, index) => {
        const votes = appState.activePoll.votes[index];
        const percentage = appState.activePoll.totalVotes > 0 ? 
            Math.round((votes / appState.activePoll.totalVotes) * 100) : 0;
        
        return `
            <div class="result-item">
                <span class="result-label">${option}</span>
                <div class="result-bar">
                    <div class="result-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="result-percentage">${percentage}%</span>
            </div>
        `;
    }).join('');
    
    resultsDisplay.innerHTML = resultsHtml;
    resultsSection.classList.remove('hidden');
}

// Utility functions
function updateAudioQuality() {
    const qualitySelect = getElement('audio-quality');
    if (!qualitySelect) return;
    
    const bitrate = parseInt(qualitySelect.value);
    let dataSaved;
    
    switch(bitrate) {
        case 32000:
            dataSaved = 85;
            break;
        case 64000:
            dataSaved = 75;
            break;
        case 128000:
            dataSaved = 65;
            break;
        default:
            dataSaved = 78;
    }
    
    appState.dataSaved = dataSaved;
    updateDataUsage();
}

function updateDataUsage() {
    const dataSavedElements = document.querySelectorAll('#data-saved');
    dataSavedElements.forEach(el => {
        el.textContent = appState.dataSaved + '%';
    });
}

function populateOfflineContent() {
    const offlineContentList = getElement('offline-content-list');
    if (!offlineContentList) return;
    
    const offlineContent = [
        { title: "AI Basics - Lecture 1", size: "8.2 MB", duration: "42 mins", downloaded: true },
        { title: "VLSI Introduction", size: "6.8 MB", duration: "38 mins", downloaded: false },
        { title: "Solar Panel Efficiency", size: "9.1 MB", duration: "45 mins", downloaded: true }
    ];
    
    const html = offlineContent.map(content => `
        <div class="content-item">
            <div class="content-info">
                <h5>${content.title}</h5>
                <div class="content-meta">${content.size} • ${content.duration}</div>
            </div>
            <div class="content-actions">
                <span class="download-status ${content.downloaded ? 'downloaded' : 'not-downloaded'}">
                    ${content.downloaded ? '✓ Downloaded' : 'Not Downloaded'}
                </span>
                ${content.downloaded ? 
                    `<button class="btn btn--sm btn--secondary" onclick="alert('Playing ${content.title}')">Play</button>` :
                    `<button class="btn btn--sm btn--primary" onclick="alert('Downloading ${content.title}...')">Download</button>`
                }
            </div>
        </div>
    `).join('');
    
    offlineContentList.innerHTML = html;
}

// Make downloadFile globally available
window.downloadFile = downloadFile;
document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const role = document.getElementById("login-role").value;

    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
    });

    const data = await res.json();
    if (data.success) {
        localStorage.setItem("role", role);
        document.getElementById("login-screen").classList.add("hidden");

        if (role === "teacher") {
            document.getElementById("teacher-screen").classList.remove("hidden");
        } else {
            document.getElementById("student-screen").classList.remove("hidden");
        }
    } else {
        alert("Login Failed: " + data.message);
    }
});




