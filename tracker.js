// ==========================================
// TraceLens UX - Usability Analytics Engine
// ==========================================

const TraceLens = {
    metrics: {
        startTime: Date.now(),
        totalClicks: 0,
        rageClicks: 0,
        maxScrollPercentage: 0,
        eventLogs: []
    },

    recentClicks: [], // Queue for detecting fast consecutive clicks (Rage Clicks)
    heatmapEnabled: false,

    init() {
        this.bindEvents();
        this.startTimer();
    },

    // 1. Session Duration Timer
    startTimer() {
        const timerEl = document.getElementById("time-display");
        setInterval(() => {
            const elapsedSec = Math.floor((Date.now() - this.metrics.startTime) / 1000);
            const minutes = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
            const seconds = String(elapsedSec % 60).padStart(2, '0');
            if (timerEl) timerEl.innerText = `${minutes}:${seconds}`;
        }, 1000);
    },

    // 2. Event Listeners setup
    bindEvents() {
        // Track all document clicks
        document.addEventListener("click", (e) => this.handleClick(e));

        // Track vertical scroll depth
        window.addEventListener("scroll", () => this.handleScroll());

        // Heatmap Mode Toggle
const heatBtn = document.getElementById("toggle-heatmap");
if (heatBtn) {
    heatBtn.addEventListener("click", () => {
        this.heatmapEnabled = !this.heatmapEnabled;
        heatBtn.classList.toggle("active", this.heatmapEnabled);
        
        const container = document.getElementById("heatmap-canvas-container");
        if (this.heatmapEnabled) {
            container.classList.add("active");
            heatBtn.innerText = "✖ Close Heatmap";
        } else {
            container.classList.remove("active");
            heatBtn.innerText = " View Heatmap";
        }
    });
}
        // Export Log Data to JSON
        const exportBtn = document.getElementById("export-json");
        if (exportBtn) {
            exportBtn.addEventListener("click", () => this.exportSessionData());
        }
    },

    // 3. Click Tracking & Rage Click Detection
    handleClick(e) {
        // Skip dashboard itself from polluting test data
        if (e.target.closest("#tracelens-dashboard")) return;

        this.metrics.totalClicks++;
        document.getElementById("click-counter").innerText = this.metrics.totalClicks;

        const targetLabel = e.target.getAttribute("data-label") || e.target.tagName;
        const now = Date.now();

        // Rage Click Heuristic: >= 3 clicks on the same element within 1 second
        this.recentClicks.push({ time: now, target: e.target });
        this.recentClicks = this.recentClicks.filter(c => now - c.time <= 1000);

        const clicksOnCurrentElement = this.recentClicks.filter(c => c.target === e.target).length;
        let isRage = false;

        if (clicksOnCurrentElement >= 3) {
            this.metrics.rageClicks++;
            document.getElementById("rage-counter").innerText = this.metrics.rageClicks;
            isRage = true;
            this.logFeed(`Rage Click detected on: "${targetLabel}"`, true);
        } else {
            this.logFeed(`Clicked: "${targetLabel}" at (${e.pageX}, ${e.pageY})`, false);
        }

        // Plot Heatmap Dot
        this.renderHeatDot(e.pageX, e.pageY);

        // Record telemetry data
        this.metrics.eventLogs.push({
            type: isRage ? "RAGE_CLICK" : "CLICK",
            target: targetLabel,
            x: e.pageX,
            y: e.pageY,
            timestamp: new Date().toISOString()
        });
    },

    // 4. Scroll Depth Calculator
    handleScroll() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (docHeight <= 0) return;

        const currentScrollPercent = Math.min(100, Math.round((scrollTop / docHeight) * 100));

        if (currentScrollPercent > this.metrics.maxScrollPercentage) {
            this.metrics.maxScrollPercentage = currentScrollPercent;
            document.getElementById("scroll-display").innerText = `${currentScrollPercent}%`;
        }
    },

    // 5. Append entries to the floating real-time log
    logFeed(message, isWarning) {
        const feed = document.getElementById("event-feed");
        if (!feed) return;

        const entry = document.createElement("div");
        entry.className = `log-entry ${isWarning ? 'rage' : ''}`;
        const timeStr = new Date().toLocaleTimeString().split(" ")[0];
        entry.innerText = `[${timeStr}] ${message}`;

        feed.prepend(entry);
    },

    // 6. Visual Heatmap Dot Plotting
    renderHeatDot(x, y) {
        const container = document.getElementById("heatmap-canvas-container");
        if (!container) return;

        const dot = document.createElement("div");
        dot.className = "heatmap-dot";
        dot.style.left = `${x}px`;
        dot.style.top = `${y}px`;
        container.appendChild(dot);
    },

    // 7. Export Telemetry JSON
    exportSessionData() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.metrics, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `TraceLens_Session_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }
};

// Initialize Tracker on DOM ready
document.addEventListener("DOMContentLoaded", () => {
    TraceLens.init();
});