# Overlay Design Document

## Overview
This document outlines the design for implementing the floating overlay window in the Android Auto Clicker application. The floating overlay is essential for displaying the draggable target and its controls over other Android applications, enabling interaction with elements outside the auto-clicker app itself.

## Key Concepts
*   **Floating Window (Overlay Window):** A window that can appear on top of other applications, typically requiring `SYSTEM_ALERT_WINDOW` permission.
*   **`WindowManager`:** An Android system service that manages windows on the device. It is used to add, update, and remove floating windows.
*   **`SYSTEM_ALERT_WINDOW` Permission:** A dangerous permission that allows an app to draw on top of other apps. This permission must be explicitly granted by the user.

## Implementation Details

### 1. `AndroidManifest.xml` Declarations
To create a floating overlay, the `SYSTEM_ALERT_WINDOW` permission is required in `AndroidManifest.xml`:

*   **Permission Declaration:**
    ```xml
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />
    ```

### 2. `OverlayService.kt`
This Kotlin class will extend `Service` and be responsible for managing the lifecycle and display of the floating window.

*   **`onCreate()`:** Initialize `WindowManager` and create the floating window view.
    ```kotlin
    class OverlayService : Service() {

        private lateinit var windowManager: WindowManager
        private lateinit var overlayView: View

        override fun onCreate() {
            super.onCreate()

            windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

            // Inflate the layout for the floating overlay
            overlayView = LayoutInflater.from(this).inflate(R.layout.overlay_layout, null)

            val params = WindowManager.LayoutParams(
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

            params.gravity = Gravity.TOP or Gravity.LEFT
            params.x = 100 // Initial X position
            params.y = 100 // Initial Y position

            windowManager.addView(overlayView, params)

            // Implement drag functionality for overlayView
            overlayView.setOnTouchListener(object : View.OnTouchListener {
                private var initialX: Int = 0
                private var initialY: Int = 0
                private var initialTouchX: Float = 0f
                private var initialTouchY: Float = 0f

                override fun onTouch(v: View?, event: MotionEvent?): Boolean {
                    when (event?.action) {
                        MotionEvent.ACTION_DOWN -> {
                            initialX = params.x
                            initialY = params.y
                            initialTouchX = event.rawX
                            initialTouchY = event.rawY
                            return true
                        }
                        MotionEvent.ACTION_MOVE -> {
                            params.x = initialX + (event.rawX - initialTouchX).toInt()
                            params.y = initialY + (event.rawY - initialTouchY).toInt()
                            windowManager.updateViewLayout(overlayView, params)
                            // Communicate new position to AutoClickerService.kt
                            return true
                        }
                        // Handle ACTION_UP for releasing the drag
                    }
                    return false
                }
            })
        }

        override fun onBind(intent: Intent?): IBinder? {
            return null // Not a bound service for now
        }

        override fun onDestroy() {
            super.onDestroy()
            if (::overlayView.isInitialized) {
                windowManager.removeView(overlayView)
            }
        }
    }
    ```

*   **`overlay_layout.xml`:** This layout file will define the UI of the floating window (e.g., the draggable target and controls). It will be placed in `res/layout/`.
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
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

        <!-- More controls as needed -->

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

### 3. Permission Request Flow (React Native / Native Module)
Users must explicitly grant `SYSTEM_ALERT_WINDOW` permission. The application will need a mechanism to check for and request this permission.

*   **Check Permission:**
    *   Native module will expose a method to check if `Settings.canDrawOverlays(context)` is true.

*   **Request Permission:**
    *   If the permission is not granted, the native module will open the 