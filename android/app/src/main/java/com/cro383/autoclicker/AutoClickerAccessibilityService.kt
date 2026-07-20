package com.cro383.autoclicker

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Color
import android.graphics.Path
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.content.res.Configuration
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.accessibility.AccessibilityEvent
import android.widget.TextView

class AutoClickerAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AutoClickerService"
        private const val MIN_INTERVAL_MS = 100L
        private const val MAX_INTERVAL_MS = 5_000L
        private const val PREFERENCES_NAME = "auto_clicker_native"
        private const val KEY_TARGET_X = "target_x"
        private const val KEY_TARGET_Y = "target_y"
        private const val KEY_HAS_TARGET = "has_target"

        @Volatile
        private var instance: AutoClickerAccessibilityService? = null

        @Volatile
        private var stateListener: ((Boolean, Int) -> Unit)? = null

        fun getInstance(): AutoClickerAccessibilityService? = instance

        fun setStateListener(listener: ((Boolean, Int) -> Unit)?) {
            stateListener = listener
        }
    }

    private val clickHandler = Handler(Looper.getMainLooper())
    private var clickIntervalMs = 1_000L
    private var targetX = 0
    private var targetY = 0
    @Volatile
    private var isRunning = false

    @Volatile
    private var clickCount = 0
    private var isDraggingTarget = false
    private var gestureInProgress = false
    private var overlayView: View? = null
    private var overlayLayoutParams: WindowManager.LayoutParams? = null
    private var controlView: TextView? = null
    private var controlLayoutParams: WindowManager.LayoutParams? = null
    private var moveHandleView: TextView? = null
    private var moveHandleLayoutParams: WindowManager.LayoutParams? = null
    private val windowManager by lazy { getSystemService(WINDOW_SERVICE) as WindowManager }
    private val preferences by lazy { getSharedPreferences(PREFERENCES_NAME, MODE_PRIVATE) }
    private val overlaySizePx by lazy { (80 * resources.displayMetrics.density).toInt() }

    private val clickRunnable = object : Runnable {
        override fun run() {
            if (!isRunning) {
                return
            }

            if (!isDraggingTarget && !gestureInProgress) {
                dispatchTap(targetX, targetY)
            }
            clickHandler.postDelayed(this, clickIntervalMs)
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        if (preferences.getBoolean(KEY_HAS_TARGET, false)) {
            targetX = preferences.getInt(KEY_TARGET_X, 0)
            targetY = preferences.getInt(KEY_TARGET_Y, 0)
        }
        instance = this
        Log.i(TAG, "Accessibility service connected")
    }

    fun startAutoClicker() {
        clickHandler.post {
            if (isRunning) {
                return@post
            }

            showOverlayInternal()
            isRunning = true
            setOverlayTouchable(false)
            showMoveHandleInternal()
            updateControlButton()
            notifyStateChanged()
            clickHandler.post(clickRunnable)
            Log.i(TAG, "Auto clicker started at ($targetX, $targetY), interval=$clickIntervalMs")
        }
    }

    fun stopAutoClicker() {
        clickHandler.post {
            stopAutoClickerInternal()
        }
    }

    fun setClickInterval(intervalMs: Int) {
        clickHandler.post {
            clickIntervalMs = intervalMs.toLong().coerceIn(MIN_INTERVAL_MS, MAX_INTERVAL_MS)
            Log.d(TAG, "Click interval updated: $clickIntervalMs")
        }
    }

    fun setTargetPosition(x: Int, y: Int) {
        clickHandler.post {
            updateTargetPositionInternal(x, y, updateOverlay = true, persist = true)
        }
    }

    fun initializeTargetPosition(x: Int, y: Int) {
        clickHandler.post {
            if (!preferences.getBoolean(KEY_HAS_TARGET, false)) {
                updateTargetPositionInternal(x, y, updateOverlay = true, persist = true)
            }
        }
    }

    fun showOverlay() {
        clickHandler.post {
            showOverlayInternal()
        }
    }

    fun hideOverlay() {
        clickHandler.post {
            if (isRunning) {
                stopAutoClickerInternal()
            }
            removeOverlayInternal()
        }
    }

    fun isOverlayVisible(): Boolean = overlayView != null

    fun isAutoClickerRunning(): Boolean = isRunning

    fun getClickCount(): Int = clickCount

    private fun stopAutoClickerInternal() {
        isRunning = false
        clickHandler.removeCallbacks(clickRunnable)
        hideMoveHandleInternal()
        setOverlayTouchable(true)
        updateControlButton()
        notifyStateChanged()
        Log.i(TAG, "Auto clicker stopped")
    }

    private fun updateTargetPositionInternal(
        x: Int,
        y: Int,
        updateOverlay: Boolean,
        persist: Boolean,
    ) {
        targetX = x.coerceAtLeast(0)
        targetY = y.coerceAtLeast(0)

        if (persist) {
            preferences.edit()
                .putBoolean(KEY_HAS_TARGET, true)
                .putInt(KEY_TARGET_X, targetX)
                .putInt(KEY_TARGET_Y, targetY)
                .apply()
        }

        if (updateOverlay) {
            val params = overlayLayoutParams
            val view = overlayView
            if (params != null && view != null) {
                params.x = targetX - overlaySizePx / 2
                params.y = targetY - overlaySizePx / 2
                clampOverlayPosition(params)
                windowManager.updateViewLayout(view, params)
                updateMoveHandlePosition()
            }
        }

        Log.d(TAG, "Target updated: ($targetX, $targetY)")
    }

    private fun showOverlayInternal() {
        if (overlayView != null) {
            return
        }

        if (!Settings.canDrawOverlays(this)) {
            Log.w(TAG, "Overlay permission is not granted")
            return
        }

        val targetView = View(this).apply {
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.argb(210, 255, 0, 0))
                setStroke((2 * resources.displayMetrics.density).toInt(), Color.WHITE)
            }
        }
        val params = WindowManager.LayoutParams(
            overlaySizePx,
            overlaySizePx,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = targetX - overlaySizePx / 2
            y = targetY - overlaySizePx / 2
        }
        clampOverlayPosition(params)
        attachDragListener(targetView, params)

        try {
            windowManager.addView(targetView, params)
            overlayView = targetView
            overlayLayoutParams = params
            showControlInternal()
            setOverlayTouchable(!isRunning)
            Log.i(TAG, "Floating target shown")
        } catch (error: RuntimeException) {
            Log.e(TAG, "Failed to show floating target", error)
        }
    }

    private fun attachDragListener(view: View, params: WindowManager.LayoutParams) {
        view.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(view: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        isDraggingTarget = true
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }

                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        clampOverlayPosition(params)
                        windowManager.updateViewLayout(view, params)
                        updateTargetPositionInternal(
                            params.x + overlaySizePx / 2,
                            params.y + overlaySizePx / 2,
                            updateOverlay = false,
                            persist = true,
                        )
                        return true
                    }

                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        isDraggingTarget = false
                        return true
                    }
                }

                return false
            }
        })
    }

    private fun setOverlayTouchable(touchable: Boolean) {
        val params = overlayLayoutParams ?: return
        val view = overlayView ?: return
        params.flags = if (touchable) {
            params.flags and WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE.inv()
        } else {
            params.flags or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
        }
        windowManager.updateViewLayout(view, params)
    }

    private fun showMoveHandleInternal() {
        if (moveHandleView != null || !isRunning) {
            return
        }

        val handle = TextView(this).apply {
            text = "MOVE"
            setTextColor(Color.WHITE)
            textSize = 22f
            gravity = Gravity.CENTER
            background = GradientDrawable().apply {
                cornerRadius = dp(36).toFloat()
                setColor(Color.rgb(37, 99, 235))
                setStroke(dp(2), Color.WHITE)
            }
        }
        val params = WindowManager.LayoutParams(
            dp(112),
            dp(72),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.START
        }

        attachMoveHandleListener(handle, params)
        moveHandleView = handle
        moveHandleLayoutParams = params
        updateMoveHandlePosition()

        try {
            windowManager.addView(handle, params)
        } catch (error: RuntimeException) {
            moveHandleView = null
            moveHandleLayoutParams = null
            Log.e(TAG, "Failed to show move handle", error)
        }
    }

    private fun attachMoveHandleListener(
        handle: View,
        handleParams: WindowManager.LayoutParams,
    ) {
        handle.setOnTouchListener(object : View.OnTouchListener {
            private var initialTargetX = 0
            private var initialTargetY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(view: View, event: MotionEvent): Boolean {
                val targetParams = overlayLayoutParams ?: return false
                val targetView = overlayView ?: return false

                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        isDraggingTarget = true
                        initialTargetX = targetParams.x
                        initialTargetY = targetParams.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }

                    MotionEvent.ACTION_MOVE -> {
                        targetParams.x = initialTargetX + (event.rawX - initialTouchX).toInt()
                        targetParams.y = initialTargetY + (event.rawY - initialTouchY).toInt()
                        clampOverlayPosition(targetParams)
                        windowManager.updateViewLayout(targetView, targetParams)
                        updateTargetPositionInternal(
                            targetParams.x + overlaySizePx / 2,
                            targetParams.y + overlaySizePx / 2,
                            updateOverlay = false,
                            persist = true,
                        )
                        positionMoveHandle(handleParams, targetParams)
                        windowManager.updateViewLayout(view, handleParams)
                        return true
                    }

                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                        isDraggingTarget = false
                        return true
                    }
                }

                return false
            }
        })
    }

    private fun updateMoveHandlePosition() {
        val handle = moveHandleView ?: return
        val handleParams = moveHandleLayoutParams ?: return
        val targetParams = overlayLayoutParams ?: return
        positionMoveHandle(handleParams, targetParams)

        if (handle.isAttachedToWindow) {
            windowManager.updateViewLayout(handle, handleParams)
        }
    }

    private fun positionMoveHandle(
        handleParams: WindowManager.LayoutParams,
        targetParams: WindowManager.LayoutParams,
    ) {
        val displayMetrics = resources.displayMetrics
        val handleWidth = dp(112)
        val handleHeight = dp(72)
        val gap = dp(8)
        val rightX = targetParams.x + overlaySizePx + gap
        handleParams.x = if (rightX + handleWidth <= displayMetrics.widthPixels) {
            rightX
        } else {
            (targetParams.x - handleWidth - gap).coerceAtLeast(0)
        }
        handleParams.y = (targetParams.y + (overlaySizePx - handleHeight) / 2)
            .coerceIn(0, (displayMetrics.heightPixels - handleHeight).coerceAtLeast(0))
    }

    private fun hideMoveHandleInternal() {
        moveHandleView?.let { view ->
            try {
                windowManager.removeView(view)
            } catch (error: RuntimeException) {
                Log.w(TAG, "Failed to remove move handle cleanly", error)
            }
        }
        moveHandleView = null
        moveHandleLayoutParams = null
        isDraggingTarget = false
    }

    private fun showControlInternal() {
        if (controlView != null) {
            return
        }

        val control = TextView(this).apply {
            text = if (isRunning) "STOP" else "START"
            setTextColor(Color.WHITE)
            textSize = 15f
            gravity = Gravity.CENTER
            setPadding(dp(18), 0, dp(18), 0)
            background = createControlBackground(isRunning)
            setOnClickListener {
                if (isRunning) {
                    stopAutoClicker()
                } else {
                    startAutoClicker()
                }
            }
        }
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            dp(48),
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT,
        ).apply {
            gravity = Gravity.TOP or Gravity.END
            x = dp(16)
            y = dp(96)
        }

        try {
            windowManager.addView(control, params)
            controlView = control
            controlLayoutParams = params
        } catch (error: RuntimeException) {
            Log.e(TAG, "Failed to show floating controls", error)
        }
    }

    private fun updateControlButton() {
        controlView?.apply {
            text = if (isRunning) "STOP" else "START"
            background = createControlBackground(isRunning)
        }
    }

    private fun createControlBackground(running: Boolean): GradientDrawable {
        return GradientDrawable().apply {
            cornerRadius = dp(10).toFloat()
            setColor(if (running) Color.rgb(185, 28, 28) else Color.rgb(22, 163, 74))
            setStroke(dp(1), Color.WHITE)
        }
    }

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()

    private fun clampOverlayPosition(params: WindowManager.LayoutParams) {
        val displayMetrics = resources.displayMetrics
        params.x = params.x.coerceIn(0, (displayMetrics.widthPixels - overlaySizePx).coerceAtLeast(0))
        params.y = params.y.coerceIn(0, (displayMetrics.heightPixels - overlaySizePx).coerceAtLeast(0))
    }

    private fun removeOverlayInternal() {
        hideMoveHandleInternal()
        overlayView?.let { view ->
            try {
                windowManager.removeView(view)
            } catch (error: RuntimeException) {
                Log.w(TAG, "Failed to remove floating target cleanly", error)
            }
        }
        controlView?.let { view ->
            try {
                windowManager.removeView(view)
            } catch (error: RuntimeException) {
                Log.w(TAG, "Failed to remove floating controls cleanly", error)
            }
        }
        overlayView = null
        overlayLayoutParams = null
        controlView = null
        controlLayoutParams = null
        Log.i(TAG, "Floating target hidden")
    }

    private fun dispatchTap(x: Int, y: Int) {
        gestureInProgress = true

        val tapPath = Path().apply {
            moveTo(x.toFloat(), y.toFloat())
        }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(tapPath, 0, 1))
            .build()

        val callback = object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                clickCount += 1
                notifyStateChanged()
                finishGestureDispatch()
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                finishGestureDispatch()
            }
        }

        if (!dispatchGesture(gesture, callback, null)) {
            Log.w(TAG, "Gesture dispatch rejected at ($x, $y)")
            finishGestureDispatch()
        }
    }

    private fun finishGestureDispatch() {
        gestureInProgress = false
    }

    private fun notifyStateChanged() {
        stateListener?.invoke(isRunning, clickCount)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Event inspection is not required for gesture dispatch.
    }

    override fun onInterrupt() {
        stopAutoClicker()
        Log.w(TAG, "Accessibility service interrupted")
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        overlayLayoutParams?.let { params ->
            clampOverlayPosition(params)
            overlayView?.let { windowManager.updateViewLayout(it, params) }
            updateTargetPositionInternal(
                params.x + overlaySizePx / 2,
                params.y + overlaySizePx / 2,
                updateOverlay = false,
                persist = true,
            )
            updateMoveHandlePosition()
        }
    }

    override fun onDestroy() {
        stopAutoClickerInternal()
        removeOverlayInternal()
        if (instance === this) {
            instance = null
        }
        Log.i(TAG, "Accessibility service destroyed")
        super.onDestroy()
    }
}
