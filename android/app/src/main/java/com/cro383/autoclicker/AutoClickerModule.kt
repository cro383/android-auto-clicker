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
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

class AutoClickerModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "AutoClickerModule"
        private const val STATE_EVENT = "AutoClickerStateChanged"
    }

    init {
        AutoClickerAccessibilityService.setStateListener { isRunning, clickCount ->
            val payload = Arguments.createMap().apply {
                putBoolean("isRunning", isRunning)
                putInt("clickCount", clickCount)
            }
            try {
                reactApplicationContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit(STATE_EVENT, payload)
            } catch (error: RuntimeException) {
                Log.w(TAG, "Unable to emit native state", error)
            }
        }
    }

    override fun getName() = "AutoClicker"

    @ReactMethod
    fun start() {
        withService("start") { it.startAutoClicker() }
    }

    @ReactMethod
    fun stop() {
        withService("stop") { it.stopAutoClicker() }
    }

    @ReactMethod
    fun setInterval(interval: Int) {
        withService("setInterval") { it.setClickInterval(interval) }
    }

    @ReactMethod
    fun setTargetPosition(x: Int, y: Int) {
        withService("setTargetPosition") { it.setTargetPosition(x, y) }
    }

    @ReactMethod
    fun showOverlay() {
        withService("showOverlay") { it.showOverlay() }
    }

    @ReactMethod
    fun hideOverlay() {
        withService("hideOverlay") { it.hideOverlay() }
    }

    @ReactMethod
    fun checkOverlayVisible(promise: Promise) {
        promise.resolve(AutoClickerAccessibilityService.getInstance()?.isOverlayVisible() ?: false)
    }

    @ReactMethod
    fun getState(promise: Promise) {
        val service = AutoClickerAccessibilityService.getInstance()
        val payload = Arguments.createMap().apply {
            putBoolean("isRunning", service?.isAutoClickerRunning() ?: false)
            putInt("clickCount", service?.getClickCount() ?: 0)
        }
        promise.resolve(payload)
    }

    @ReactMethod
    fun addListener(eventName: String) {
        Log.d(TAG, "Listener added for $eventName")
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        Log.d(TAG, "$count listener(s) removed")
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

    private inline fun withService(
        actionName: String,
        action: (AutoClickerAccessibilityService) -> Unit,
    ) {
        val service = AutoClickerAccessibilityService.getInstance()
        if (service == null) {
            Log.w(TAG, "$actionName ignored because the accessibility service is not connected")
            return
        }

        action(service)
    }

    override fun invalidate() {
        AutoClickerAccessibilityService.setStateListener(null)
        super.invalidate()
    }
}
