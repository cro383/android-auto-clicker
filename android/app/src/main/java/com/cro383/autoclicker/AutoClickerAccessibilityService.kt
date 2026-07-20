package com.cro383.autoclicker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.accessibility.AccessibilityEvent

class AutoClickerAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AutoClickerService"
        private const val MIN_INTERVAL_MS = 100L
        private const val MAX_INTERVAL_MS = 5_000L

        @Volatile
        private var instance: AutoClickerAccessibilityService? = null

        fun getInstance(): AutoClickerAccessibilityService? = instance
    }

    private val clickHandler = Handler(Looper.getMainLooper())
    private var clickIntervalMs = 1_000L
    private var targetX = 0
    private var targetY = 0
    private var isRunning = false

    private val clickRunnable = object : Runnable {
        override fun run() {
            if (!isRunning) {
                return
            }

            dispatchTap(targetX, targetY)
            clickHandler.postDelayed(this, clickIntervalMs)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        Log.i(TAG, "Accessibility service connected")
    }

    fun startAutoClicker() {
        if (isRunning) {
            return
        }

        isRunning = true
        clickHandler.post(clickRunnable)
        Log.i(TAG, "Auto clicker started at ($targetX, $targetY), interval=$clickIntervalMs")
    }

    fun stopAutoClicker() {
        isRunning = false
        clickHandler.removeCallbacks(clickRunnable)
        Log.i(TAG, "Auto clicker stopped")
    }

    fun setClickInterval(intervalMs: Int) {
        clickIntervalMs = intervalMs.toLong().coerceIn(MIN_INTERVAL_MS, MAX_INTERVAL_MS)
        Log.d(TAG, "Click interval updated: $clickIntervalMs")
    }

    fun setTargetPosition(x: Int, y: Int) {
        targetX = x.coerceAtLeast(0)
        targetY = y.coerceAtLeast(0)
        Log.d(TAG, "Target updated: ($targetX, $targetY)")
    }

    private fun dispatchTap(x: Int, y: Int) {
        val tapPath = Path().apply {
            moveTo(x.toFloat(), y.toFloat())
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(tapPath, 0, 1))
            .build()

        if (!dispatchGesture(gesture, null, null)) {
            Log.w(TAG, "Gesture dispatch rejected at ($x, $y)")
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Event inspection is not required for gesture dispatch.
    }

    override fun onInterrupt() {
        stopAutoClicker()
        Log.w(TAG, "Accessibility service interrupted")
    }

    override fun onDestroy() {
        stopAutoClicker()
        if (instance === this) {
            instance = null
        }
        Log.i(TAG, "Accessibility service destroyed")
        super.onDestroy()
    }
}
