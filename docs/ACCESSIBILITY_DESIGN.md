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
        android:packageNames="com.example.androidautoclicker"  <!-- Or target all apps if needed -->
        android:accessibilityEventTypes="typeAllMask"
        android:accessibilityFlags="flagRequestFilterKeyEvents|flagReportViewIds|flagRequestTouchExplorationMode"
        android:accessibilityFeedbackType="feedbackGeneric"
        android:notificationTimeout="100"
        android:canRetrieveWindowContent="true"
        android:canPerformGestures="true"
        android:settingsActivity="com.example.androidautoclicker.SettingsActivity" />
    ```
    *   `android:canPerformGestures="true"` is critical for `dispatchGesture()`.
    *   `android:packageNames` can be configured to target specific applications or left out to target all applications.

### 2. `AutoClickerAccessibilityService.kt`
This Kotlin class will extend `AccessibilityService` and implement its lifecycle methods and gesture dispatching logic.

*   **`onServiceConnected()`:** Called when the system successfully connects to the Accessibility Service. This is where initial setup and configuration can be done.
    ```kotlin
    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d(TAG, "Accessibility Service Connected")
        val serviceInfo = AccessibilityServiceInfo()
        serviceInfo.flags = AccessibilityServiceInfo.FLAG_REQUEST_FILTER_KEY_EVENTS or
                             AccessibilityServiceInfo.FLAG_REPORT_VIEW_IDS or
                             AccessibilityServiceInfo.FLAG_REQUEST_TOUCH_EXPLORATION_MODE
        serviceInfo.eventTypes = AccessibilityEvent.TYPES_ALL_MASK
        serviceInfo.feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
        serviceInfo.notificationTimeout = 100
        serviceInfo.packageNames = arrayOf("com.example.androidautoclicker") // Or null for all
        this.serviceInfo = serviceInfo
    }
    ```

*   **`onAccessibilityEvent(event: AccessibilityEvent?)`:** This method is called when an accessibility event occurs. While not directly used for *dispatching* gestures, it can be used for monitoring or reacting to events if future features require it.
    ```kotlin
    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Log or handle accessibility events if necessary
        Log.d(TAG, "Accessibility event: ${event?.eventType}")
    }
    ```

*   **`onInterrupt()`:** Called when the system interrupts the service (e.g., another accessibility service is enabled).
    ```kotlin
    override fun onInterrupt() {
        Log.d(TAG, "Accessibility Service Interrupted")
    }
    ```

*   **`dispatchClickGesture(x: Int, y: Int)`:** This custom method will be called by `AutoClickerService.kt` to perform a simulated click.
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

### 3. Permission Request Flow (React Native / Native Module)
Users must explicitly grant Accessibility Service permission. The application will need a mechanism to check for and request this permission.

*   **Check Permission:**
    *   Native module will expose a method to check if the Accessibility Service is enabled.
    *   This typically involves checking `Settings.Secure.getString(contentResolver, Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES)` and `TextUtils.SimpleStringSplitter.split()` to see if the service's component name is present.

*   **Request Permission:**
    *   If the service is not enabled, the native module will open the Accessibility Settings screen for the user.
    *   ```kotlin
        val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
        ```

## Communication with `AutoClickerService.kt`
`AutoClickerAccessibilityService.kt` will expose a method (e.g., `dispatchClickGesture`) that `AutoClickerService.kt` can call to trigger simulated clicks. This communication can be established using a bound service or local broadcast receivers, with a bound service being preferable for direct method calls.

## Error Handling and Edge Cases
*   **Permission Denied:** The application must gracefully handle cases where the user denies Accessibility Service permission, providing clear instructions on how to enable it.
*   **Service Interrupted:** The `onInterrupt()` callback can be used to notify the `AutoClickerService.kt` or React Native UI that the service has been interrupted, allowing for appropriate action (e.g., pausing auto-clicking).
*   **API Level Compatibility:** `dispatchGesture()` was introduced in API Level 24 (Android 7.0 - Nougat). Older Android versions will require alternative approaches if support is needed (though the project currently targets Android only and Expo SDK 54 likely implies newer API levels).
