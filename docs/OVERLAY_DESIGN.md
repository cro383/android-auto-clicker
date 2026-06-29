# Overlay Design Document

## Overview
This document outlines the design for implementing the floating overlay window, which will be managed directly by the `AccessibilityService`. The floating overlay is essential for displaying the draggable target and its controls over other Android applications, enabling interaction with elements outside the auto-clicker app itself.

## Key Concepts
*   **Floating Window (Overlay Window):** A window that can appear on top of other applications, typically requiring `SYSTEM_ALERT_WINDOW` permission.
*   **`WindowManager`:** An Android system service that manages windows on the device. It is used to add, update, and remove floating windows.
*   **`SYSTEM_ALERT_WINDOW` Permission:** A dangerous permission that allows an app to draw on top of other apps. This permission must be explicitly granted by the user.

## Implementation Details within `AccessibilityService`

### 1. `AndroidManifest.xml` Declarations
To create a floating overlay, the `SYSTEM_ALERT_WINDOW` permission is required in `AndroidManifest.xml`:

*   **Permission Declaration:**
    ```xml
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    ```

### 2. Overlay Management in `AutoClickerAccessibilityService.kt`
The `AutoClickerAccessibilityService.kt` will be responsible for the full lifecycle of the floating overlay.

*   **Initialization (`initializeOverlay()` method within `onServiceConnected()` or a dedicated call):
    ```kotlin
    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: View
    private lateinit var overlayLayoutParams: WindowManager.LayoutParams

    private fun initializeOverlay() {
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

        // Inflate the layout for the floating overlay
        overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null)

        overlayLayoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            // Use TYPE_APPLICATION_OVERLAY for API 26 and above
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            } else {
                WindowManager.LayoutParams.TYPE_PHONE
            },
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        )

        overlayLayoutParams.gravity = Gravity.TOP or Gravity.LEFT
        overlayLayoutParams.x = 100 // Initial X position
        overlayLayoutParams.y = 100 // Initial Y position

        if (Settings.canDrawOverlays(this)) {
            windowManager.addView(overlayView, overlayLayoutParams)
        } else {
            Log.w(TAG, "SYSTEM_ALERT_WINDOW permission not granted. Cannot add overlay.")
            // Optionally request permission here or guide user
        }

        // Implement drag functionality for overlayView
        overlayView.setOnTouchListener(object : View.OnTouchListener {
            private var initialX: Int = 0
            private var initialY: Int = 0
            private var initialTouchX: Float = 0f
            private var initialTouchY: Float = 0f

            override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                when (event?.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = overlayLayoutParams.x
                        initialY = overlayLayoutParams.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        overlayLayoutParams.x = initialX + (event.rawX - initialTouchX).toInt()
                        overlayLayoutParams.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager.updateViewLayout(overlayView, overlayLayoutParams)
                        // Update target position within AccessibilityService
                        updateTargetPosition(overlayLayoutParams.x, overlayLayoutParams.y)
                        return true
                    }
                    // Handle ACTION_UP for releasing the drag
                    MotionEvent.ACTION_UP -> {
                        // Save final position if needed
                        return true
                    }
                }
                return false
            }
        })
    }
    ```

*   **Removal (`removeOverlay()` method, typically called in `onDestroy()` or `onInterrupt()`):
    ```kotlin
    private fun removeOverlay() {
        if (::overlayView.isInitialized && overlayView.windowToken != null) {
            windowManager.removeView(overlayView)
        }
    }
    ```

*   **Updating Overlay Position/Visibility:** Methods within `AccessibilityService` to update the overlay's position or visibility based on commands from React Native or internal logic.
    ```kotlin
    fun updateOverlayPosition(x: Int, y: Int) {
        if (::overlayView.isInitialized && overlayView.windowToken != null) {
            overlayLayoutParams.x = x
            overlayLayoutParams.y = y
            windowManager.updateViewLayout(overlayView, overlayLayoutParams)
        }
    }

    fun setOverlayVisibility(visible: Boolean) {
        if (::overlayView.isInitialized && overlayView.windowToken != null) {
            overlayView.visibility = if (visible) View.VISIBLE else View.GONE
        }
    }
    ```

### 3. Overlay UI (`res/layout/overlay_layout.xml`)
This layout file will define the UI of the floating window, including the draggable target and controls. This UI will be built using native Android Views.

*   **`overlay_layout.xml`:**
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
        android:id="@+id/overlay_root_layout"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:background="#80FF0000" > <!-- Example: semi-transparent red background -->

        <!-- Draggable Target (e.g., a custom View or ImageView) -->
        <View
            android:id="@+id/draggable_target_view"
            android:layout_width="80dp"
            android:layout_height="80dp"
            android:background="@drawable/circle_red" />

        <!-- Controls (e.g., buttons for start/stop, interval) -->
        <Button
            android:id="@+id/start_button"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Start" />

        <Button
            android:id="@+id/stop_button"
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Stop" />

        <!-- Interval controls, status display, etc. -->

    </LinearLayout>
    ```

*   **`circle_red.xml`:** A drawable for the circular target (placed in `res/drawable/`).
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <shape xmlns:android="http://schemas.android.com/apk/res/android"
        android:shape="oval">
        <solid android:color="#FF0000" />
        <size android:width="80dp" android:height="80dp" />
    </shape>
    ```

### 4. Permission Request Flow (Managed by `AccessibilityService`)
Users must explicitly grant `SYSTEM_ALERT_WINDOW` permission. The `AccessibilityService` will contain the logic to check for and request this permission.

*   **Check Permission (`checkOverlayPermission()` method within `AccessibilityService`):
    ```kotlin
    fun checkOverlayPermission(): Boolean {
        return Settings.canDrawOverlays(this)
    }
    ```

*   **Request Permission (`requestOverlayPermission()` method within `AccessibilityService`):
    ```kotlin
    fun requestOverlayPermission() {
        val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + packageName))
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }
    ```

## Communication with React Native
The React Native UI will communicate with the `AccessibilityService` (which manages the overlay) via a Native Module. The Native Module will expose methods to React Native for actions such as showing/hiding the overlay, updating its position, and receiving events from overlay interactions (e.g., button presses).

## Considerations
*   **Touch Events:** Ensure touch events on the overlay are correctly handled to allow dragging and interaction with controls, while also not interfering with underlying application touch events when not interacting with the overlay itself.
*   **Screen Orientation/Size Changes:** The overlay needs to adapt to screen orientation changes and different screen sizes. `WindowManager.LayoutParams` should be updated accordingly.
*   **Lifecycle Management:** Proper management of the overlay (adding and removing views) is crucial to prevent window leaks and ensure smooth operation.
