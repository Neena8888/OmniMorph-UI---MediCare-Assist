// ============================================================
// MEDICARE ASSIST — MULTIMODAL VOICE ENGINE (FINAL STABLE)
// ============================================================

const MediCareApp = {
    currentMode: 'manual',
    recognition: null,
    isListening: false,
    lockTrigger: false,

    init() {
        this.setupRecognitionEngine();
        this.attachEventListeners();
    },

    // Clear Audio Feedback
    synthesizeSpeech(message) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const speech = new SpeechSynthesisUtterance(message);
            speech.rate = 1.1;
            speech.pitch = 1.0;
            window.speechSynthesis.speak(speech);
        }
    },

    // Speech Engine Setup
    setupRecognitionEngine() {
        const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechAPI) {
            this.setFeedback("Speech Recognition not supported. Please use Google Chrome.");
            return;
        }

        this.recognition = new SpeechAPI();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            const dot = document.getElementById("voice-dot");
            if (dot) dot.classList.add("listening");
            this.setFeedback("Voice Modality Active: Ready for input...");
        };

        this.recognition.onresult = (e) => {
            if (this.lockTrigger) return;

            const transcript = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
            const feed = document.getElementById("transcript-display");
            if (feed) feed.innerText = `Heard: "${transcript}"`;

            this.lockTrigger = true;
            this.executeVoiceCommand(transcript);

            setTimeout(() => {
                this.lockTrigger = false;
            }, 600);
        };

        this.recognition.onerror = (err) => {
            console.warn("Speech Engine Notice:", err.error);
        };

        this.recognition.onend = () => {
            if (this.currentMode === 'voice') {
                try {
                    this.recognition.start();
                } catch(e) {}
            } else {
                this.isListening = false;
                const dot = document.getElementById("voice-dot");
                if (dot) dot.classList.remove("listening");
            }
        };
    },

    // Direct Voice Command Parser
    executeVoiceCommand(cmd) {
        // 1. Submit Trigger (Sabse pehle check karein)
        if (cmd.includes("submit") || cmd.includes("send") || cmd.includes("complete")) {
            this.submitTriage();
            return;
        }

        // 2. Patient Name
        if (cmd.includes("name")) {
            let extracted = cmd.replace(/.*name\s*(is)?\s*/i, "").trim();
            if (extracted.length > 0) {
                const titleName = extracted.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                const field = document.getElementById("patient-name");
                field.value = titleName;
                this.flashField(field);
                this.setFeedback(`Patient Name: ${titleName}`);
                this.synthesizeSpeech(`Name ${titleName} set.`);
                return;
            }
        }

        // 3. Chief Complaint & Symptoms (Broad keyword support)
        const symptomKeywords = ["symptom", "symptoms", "note", "notes", "complaint", "pain", "patient has", "problem", "suffering", "fever", "cough", "headache", "chest"];
        let matchedKeyword = symptomKeywords.find(k => cmd.includes(k));

        if (matchedKeyword) {
            let noteContent = cmd;
            if (cmd.includes(matchedKeyword)) {
                noteContent = cmd.substring(cmd.indexOf(matchedKeyword)).replace(/^(symptom|symptoms|note|notes|complaint|problem)\s*(is|are)?\s*/i, "").trim();
            }
            if (noteContent.length > 0) {
                const field = document.getElementById("clinical-notes");
                const formatted = noteContent.charAt(0).toUpperCase() + noteContent.slice(1);
                field.value = field.value ? `${field.value}. ${formatted}` : formatted;
                this.flashField(field);
                this.setFeedback("Clinical note updated");
                this.synthesizeSpeech("Clinical note recorded.");
                return;
            }
        }

        // 4. Triage Priority
        if (cmd.includes("critical") || cmd.includes("emergency")) {
            const field = document.getElementById("urgency-level");
            field.value = "Critical";
            this.flashField(field);
            this.setFeedback("Priority: Critical Emergency");
            this.synthesizeSpeech("Urgency set to Critical Emergency.");
            return;
        } 
        if (cmd.includes("urgent") || cmd.includes("priority")) {
            const field = document.getElementById("urgency-level");
            field.value = "Urgent";
            this.flashField(field);
            this.setFeedback("Priority: Urgent");
            this.synthesizeSpeech("Urgency set to Priority Urgent.");
            return;
        } 
        if (cmd.includes("routine") || cmd.includes("normal") || cmd.includes("standard")) {
            const field = document.getElementById("urgency-level");
            field.value = "Routine";
            this.flashField(field);
            this.setFeedback("Priority: Routine Care");
            this.synthesizeSpeech("Urgency set to Routine.");
            return;
        }

        // 5. Clinical Departments
        if (cmd.includes("cardio") || cmd.includes("heart")) {
            const field = document.getElementById("dept-select");
            field.value = "Cardiology";
            this.flashField(field);
            this.setFeedback("Department: Cardiology");
            this.synthesizeSpeech("Department set to Cardiology.");
            return;
        }
        if (cmd.includes("neuro") || cmd.includes("brain")) {
            const field = document.getElementById("dept-select");
            field.value = "Neurology";
            this.flashField(field);
            this.setFeedback("Department: Neurology");
            this.synthesizeSpeech("Department set to Neurology.");
            return;
        }
        if (cmd.includes("trauma")) {
            const field = document.getElementById("dept-select");
            field.value = "Trauma Care";
            this.flashField(field);
            this.setFeedback("Department: Trauma Care");
            this.synthesizeSpeech("Department set to Trauma Care.");
            return;
        }
        if (cmd.includes("general")) {
            const field = document.getElementById("dept-select");
            field.value = "General Outpatient";
            this.flashField(field);
            this.setFeedback("Department: General Outpatient");
            this.synthesizeSpeech("Department set to General Outpatient.");
            return;
        }

        // 6. Form Clearing
        if (cmd.includes("clear") || cmd.includes("reset")) {
            document.getElementById("patient-form").reset();
            this.setFeedback("Form cleared");
            this.synthesizeSpeech("Record cleared.");
            return;
        }

        // 7. Adaptive Layout Toggles
        if (cmd.includes("contrast")) {
            document.body.classList.toggle("high-contrast");
            const active = document.body.classList.contains("high-contrast");
            this.synthesizeSpeech(active ? "High contrast enabled." : "High contrast disabled.");
            return;
        }
        if (cmd.includes("focus")) {
            document.body.classList.toggle("focus-mode");
            const active = document.body.classList.contains("focus-mode");
            this.synthesizeSpeech(active ? "Focus view enabled." : "Focus view closed.");
            return;
        }
        if (cmd.includes("font") || cmd.includes("large") || cmd.includes("text")) {
            document.body.classList.toggle("large-font");
            const active = document.body.classList.contains("large-font");
            this.synthesizeSpeech(active ? "Large text enabled." : "Standard text restored.");
            return;
        }
    },

    flashField(el) {
        el.classList.add("voice-targeted");
        setTimeout(() => el.classList.remove("voice-targeted"), 700);
    },

    setFeedback(msg) {
        const status = document.getElementById("system-status");
        if (status) status.innerText = msg;
    },

    submitTriage() {
        const nameInput = document.getElementById("patient-name");
        const name = nameInput ? nameInput.value.trim() : "";
        const urgency = document.getElementById("urgency-level").value;
        const dept = document.getElementById("dept-select").value;

        if (!name) {
            this.synthesizeSpeech("Patient name is missing. Please state name first.");
            this.setFeedback("Validation Error: Please provide patient name.");
            return;
        }

        // High priority voice confirmation
        this.synthesizeSpeech(`Triage submitted for ${name}. Priority ${urgency}.`);
        this.setFeedback(`Success: Triage submitted for ${name} (${urgency} - ${dept})`);

        // Highlight submit button visually
        const submitBtn = document.getElementById("btn-submit");
        if (submitBtn) {
            submitBtn.style.transform = "scale(0.98)";
            setTimeout(() => { submitBtn.style.transform = "none"; }, 200);
        }
    },

    attachEventListeners() {
        const manualBtn = document.getElementById("btn-manual");
        const voiceBtn = document.getElementById("btn-voice");
        const ambientBtn = document.getElementById("btn-ambient");

        if (manualBtn) {
            manualBtn.addEventListener("click", () => {
                this.currentMode = 'manual';
                manualBtn.classList.add("active");
                voiceBtn.classList.remove("active");
                ambientBtn.classList.remove("active");
                if (this.recognition && this.isListening) {
                    try { this.recognition.stop(); } catch(e){}
                }
                this.setFeedback("System Ready: Keyboard & Pointer Active");
            });
        }

        if (voiceBtn) {
            voiceBtn.addEventListener("click", () => {
                this.currentMode = 'voice';
                voiceBtn.classList.add("active");
                manualBtn.classList.remove("active");
                ambientBtn.classList.remove("active");
                if (this.recognition) {
                    try { this.recognition.start(); } catch(e){}
                }
                this.synthesizeSpeech("Voice interface active. Ready for commands.");
            });
        }

        if (ambientBtn) {
            ambientBtn.addEventListener("click", () => {
                ambientBtn.classList.toggle("active");
                document.body.classList.toggle("high-contrast");
                const active = document.body.classList.contains("high-contrast");
                this.setFeedback(active ? "Sensor Active: Dim lighting detected -> High Contrast Applied" : "Sensor Active: Standard lighting restored");
                this.synthesizeSpeech(active ? "Low light detected. High contrast applied." : "Standard lighting restored.");
            });
        }

        // Toolbar Buttons
        document.getElementById("toggle-contrast").addEventListener("click", () => {
            document.body.classList.toggle("high-contrast");
        });
        document.getElementById("toggle-focus").addEventListener("click", () => {
            document.body.classList.toggle("focus-mode");
        });
        document.getElementById("toggle-font").addEventListener("click", () => {
            document.body.classList.toggle("large-font");
        });

        // Reset Layout
        document.getElementById("reset-ui").addEventListener("click", () => {
            document.body.classList.remove("high-contrast", "focus-mode", "large-font");
            document.querySelectorAll(".adapt-chip").forEach(btn => btn.classList.remove("active"));
            document.getElementById("patient-form").reset();
            this.synthesizeSpeech("Interface and form reset.");
            this.setFeedback("System Reset: Standard view active.");
        });

        // Exit Focus
        const exitFocusBtn = document.getElementById("exit-focus-btn");
        if (exitFocusBtn) {
            exitFocusBtn.addEventListener("click", () => {
                document.body.classList.remove("focus-mode");
            });
        }

        // Action Buttons
        document.getElementById("btn-submit").addEventListener("click", () => this.submitTriage());
        document.getElementById("btn-clear").addEventListener("click", () => {
            document.getElementById("patient-form").reset();
            this.synthesizeSpeech("Form cleared.");
        });
    }
};

document.addEventListener("DOMContentLoaded", () => {
    MediCareApp.init();
});