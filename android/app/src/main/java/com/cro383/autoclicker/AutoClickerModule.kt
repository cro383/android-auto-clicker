package com.cro383.autoclicker

import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class AutoClickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AutoClickerModule"
    }

    override fun getName() = "AutoClicker"

    @ReactMethod
    fun start() {
        // Placeholder for starting the auto clicker
        Log.d(TAG, "start called")
    }

    @ReactMethod
    fun stop() {
        // Placeholder for stopping the auto clicker
        Log.d(TAG, "stop called")
    }

    @ReactMethod
    fun setInterval(interval: Int) {
        // Placeholder for setting the interval
        Log.d(TAG, "setInterval called with interval: $interval")
    }

    @ReactMethod
    fun setTargetPosition(x: Int, y: Int) {
        // Placeholder for setting the target position
        Log.d(TAG, "setTargetPosition called with x: $x, y: $y")
    }

    @ReactMethod
    fun checkAccessibilityPermission(promise: Promise) {
        val accessibilityEnabled = Settings.Secure.getInt(
            reactApplicationContext.contentResolver,
            Settings.Secure.ACCESSIBILITY_ENABLED,
            0,
        ) == 1

        if (!accessibilityEnabled) {
            promise.resolve(false)
            return
        }

        val serviceName = ComponentName(
            reactApplicationContext,
            AutoClickerAccessibilityService::class.java,
        ).flattenToString()
        val enabledServices = Settings.Secure.getString(
            reactApplicationContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
        ).orEmpty()

        promise.resolve(
            enabledServices.split(':').any { it.equals(serviceName, ignoreCase = true) },
        )
    }

    @ReactMethod
    fun requestAccessibilityPermission() {
        openSettings(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
    }

    @ReactMethod
    fun checkOverlayPermission(promise: Promise) {
        promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
    }

    @ReactMethod
    fun requestOverlayPermission() {
        openSettings(
            Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${reactApplicationContext.packageName}"),
            ),
        )
    }

    private fun openSettings(intent: Intent) {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactApplicationContext.startActivity(intent)
    }
}
