# Accessibility Design Document

## Overview
This document details the design for integrating the Android Accessibility Service into the Auto Clicker application. The Accessibility Service is crucial for enabling the auto-clicker to perform simulated taps (gestures) over other applications, a core requirement for a real Android Auto Clicker.

## Key Concepts
*   **Accessibility Service:** An Android system service that provides alternative ways to interact with the device for users with disabilities. For the auto-clicker, it will be used to dispatch `Gesture` objects.
*   **`dispatchGesture()`:** A method provided by the `AccessibilityService` API that allows an application to inject a series of `Gesture` events into the system. This is how simulated clicks will be performed.
*   **Permissions:** The Accessibility Service requires specific user permissions, which must be explicitly granted by the user through system settings.

## Implementation Details

### 1. `AndroidManifest.xml` Declarations
To utilize an `AccessibilityService`, the following declarations are required in `AndroidManifest.xml`:

*   **Service Declaration:** The `AutoClickerAccessibilityService` must be declared as a service.
    ```xml
    <service
        android:name=".AutoClickerAccessibilityService"
        android:permission="android.permission.BIND_ACCESSIBILITY_SERVICE"
        android:label="@string/accessibility_service_label">
        <intent-filter>
            <action android:name="android.accessibilityservice.AccessibilityService" />
        </intent-filter>
        <meta-data
            android:name="android.accessibilityservice"
            android:resource="@xml/accessibility_service_config" />
    </service>
    ```

*   **`accessibility_service_config.xml`:** This XML file defines the capabilities and configuration of the Accessibility Service. It will be placed in `res/xml/`.
    ```xml
    <accessibility-service xmlns:android="http://schemas.android.com/apk/res/android"
        android:description="@string/accessibility_service_description"
        android:accessibilityEventTypes="typeAllMask"
        android:accessibilityFlags="flagReportViewIds|flagRequestTouchExplorationMode"
        android:accessibilityFeedbackType="feedbackGeneric"
        android:notificationTimeout="100"
        android:canRetrieveWindowContent="true"
        android:canPerformGestures="true" />
    ```
    *   `android:canPerformGestures="true"` is critical for `dispatchGesture()`.
    *   `android:packageNames` should *not* be specified, allowing the service to interact with all applications.
    *   Unnecessary flags like `flagRequestFilterKeyEvents` and `flagRequestTouchExplorationMode` have been removed unless strictly required for future features.

### 2. `AutoClickerAccessibilityService.kt` (Core Native Component)
This Kotlin class will extend `AccessibilityService` and implement its lifecycle methods, gesture dispatching, timer execution, overlay management, and permission handling.

*   **`onServiceConnected()`:** Called when the system successfully connects to the Accessibility Service. This is where initial setup, timer initialization, and overlay setup can be done.
    ```kotlin
    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Accessibility Service Connected")
        val serviceInfo = AccessibilityServiceInfo()
        serviceInfo.flags = AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS
        serviceInfo.eventTypes = AccessibilityEvent.TYPES_ALL_MASK
        serviceInfo.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
        serviceInfo.notificationTimeout = 100
        // serviceInfo.packageNames = null // Allow all packages
        this.serviceInfo = serviceInfo

        // Initialize timer and overlay here
        initializeOverlay()
        initializeTimer()
    }
    ```

*   **`onAccessibilityEvent(event: AccessibilityEvent?)`:** This method is called when an accessibility event occurs. It can be used for monitoring or reacting to events if future features require it, but not for dispatching gestures.
    ```kotlin
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Log or handle accessibility events if necessary
        Log.d(TAG, "Accessibility event: ${event?.eventType}")
    }
    ```

*   **`onInterrupt()`:** Called when the system interrupts the service (e.g., another accessibility service is enabled). This is where cleanup and state saving should occur.
    ```kotlin
    override fun onInterrupt() {
        Log.d(TAG, "Accessibility Service Interrupted")
        stopTimer()
        removeOverlay()
    }
    ```

*   **`dispatchClickGesture(x: Int, y: Int)`:** This method will perform a simulated click at the given coordinates.
    ```kotlin
    fun dispatchClickGesture(x: Int, y: Int) {
        val path = Path()
        path.moveTo(x.toFloat(), y.toFloat())

        val builder = GestureDescription.Builder()
        builder.addStroke(GestureDescription.StrokeDescription(path, 0, 1))

        val gesture = builder.build()
        val result = dispatchGesture(gesture, object : AccessibilityService.GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                super.onCompleted(gestureDescription)
                Log.d(TAG, "Gesture completed at ($x, $y)")
            }

            override fun onCancelled(gestureDescription: GestureDescription?) {
                super.onCancelled(gestureDescription)
                Log.w(TAG, "Gesture cancelled at ($x, $y)")
            }
        }, null)
        Log.d(TAG, "Dispatching gesture result: $result")
    }
    ```

*   **Timer Execution:** The `AccessibilityService` will manage a timer (e.g., `Handler` and `Runnable` or `ScheduledExecutorService`) to periodically call `dispatchClickGesture()`.
    ```kotlin
    private var clickHandler: Handler? = null
    private var clickRunnable: Runnable? = null
    private var clickInterval: Long = 1000 // Default to 1 second
    private var targetX: Int = 0
    private var targetY: Int = 0

    private fun initializeTimer() {
        clickHandler = Handler(Looper.getMainLooper())
        clickRunnable = object : Runnable {
            override fun run() {
                dispatchClickGesture(targetX, targetY)
                clickHandler?.postDelayed(this, clickInterval)
            }
        }
    }

    fun startAutoClicker(x: Int, y: Int, interval: Long) {
        targetX = x
        targetY = y
        clickInterval = interval
        stopTimer() // Ensure any existing timer is stopped
        clickHandler?.post(clickRunnable!!)
        Log.d(TAG, "Auto Clicker Started at ($targetX, $targetY) with interval $clickInterval")
    }

    fun stopAutoClicker() {
        clickHandler?.removeCallbacks(clickRunnable!!)
        Log.d(TAG, "Auto Clicker Stopped")
    }

    private fun stopTimer() {
        clickHandler?.removeCallbacks(clickRunnable!!)
    }
    ```

*   **Overlay Management:** The `AccessibilityService` will also handle the creation, display, and interaction of the floating overlay. (Detailed in `OVERLAY_DESIGN.md`).

*   **Permission Management:** The `AccessibilityService` will contain methods to check and request `SYSTEM_ALERT_WINDOW` permission, and guide the user to enable the Accessibility Service itself.
    ```kotlin
    fun isAccessibilityServiceEnabled(): Boolean {
        val accessibilityManager = getSystemService(Context.ACCESSIBILITY_SERVICE) as AccessibilityManager
        val enabledServices = accessibilityManager.getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
        for (service in enabledServices) {
            if (service.id == componentName.flattenToString()) {
                return true
            }
        }
        return false
    }

    fun requestAccessibilityServicePermission() {
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }
    ```

### 3. Communication with React Native (via Native Module)
React Native will communicate with the `AccessibilityService` indirectly through a Native Module (e.g., `AutoClickerModule.kt`). This module will expose methods to React Native that, in turn, call methods on the running `AccessibilityService` instance.

*   **`AutoClickerModule.kt` (Simplified Proxy):
    ```kotlin
    class AutoClickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

        override fun getName() = "AutoClickerModule"

        @ReactMethod
        fun start(x: Int, y: Int, interval: Int) {
            val accessibilityService = // Get running instance of AutoClickerAccessibilityService
            accessibilityService?.startAutoClicker(x, y, interval.toLong())
        }

        @ReactMethod
        fun stop() {
            val accessibilityService = // Get running instance of AutoClickerAccessibilityService
            accessibilityService?.stopAutoClicker()
        }

        @ReactMethod
        fun setTargetPosition(x: Int, y: Int) {
            val accessibilityService = // Get running instance of AutoClickerAccessibilityService
            accessibilityService?.updateTargetPosition(x, y)
        }

        // Methods to check/request permissions
        @ReactMethod
        fun checkAccessibilityPermission(promise: Promise) {
            val accessibilityService = // Get running instance of AutoClickerAccessibilityService
            promise.resolve(accessibilityService?.isAccessibilityServiceEnabled() ?: false)
        }

        @ReactMethod
        fun requestAccessibilityPermission() {
            val accessibilityService = // Get running instance of AutoClickerAccessibilityService
            accessibilityService?.requestAccessibilityServicePermission()
        }

        @ReactMethod
        fun checkOverlayPermission(promise: Promise) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        }

        @ReactMethod
        fun requestOverlayPermission() {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + reactApplicationContext.packageName))
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
        }
    }
    ```
    *   **Note:** Obtaining the running `AccessibilityService` instance from a Native Module requires careful implementation (e.g., using a singleton pattern or a broadcast/event bus within the native layer).

## Error Handling and Edge Cases
*   **Permission Denied:** The application must gracefully handle cases where the user denies Accessibility Service or `SYSTEM_ALERT_WINDOW` permissions.
*   **Service Interrupted:** The `onInterrupt()` callback will stop the timer and remove the overlay.
*   **API Level Compatibility:** `dispatchGesture()` requires API Level 24+.
