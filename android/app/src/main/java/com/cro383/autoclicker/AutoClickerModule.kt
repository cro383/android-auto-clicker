package com.cro383.autoclicker

import android.accessibilityservice.AccessibilityServiceInfo
import android.content.ComponentName
import android.content.Intent
import android.net.Uri
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityManager
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
    fun start(promise: Promise) {
        val service = AutoClickerAccessibilityService.getInstance()
        if (service == null) {
            Log.w(TAG, "start ignored because the accessibility service is not connected")
            promise.resolve(false)
            return
        }

        service.startAutoClicker()
        promise.resolve(true)
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
    fun initializeTargetPosition(x: Int, y: Int) {
        withService("initializeTargetPosition") { it.initializeTargetPosition(x, y) }
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
        if (AutoClickerAccessibilityService.getInstance() != null) {
            promise.resolve(true)
            return
        }

        val accessibilityManager = reactApplicationContext.getSystemService(
            AccessibilityManager::class.java,
        )
        val expectedComponent = ComponentName(
            reactApplicationContext,
            AutoClickerAccessibilityService::class.java,
        )
        val isEnabled = accessibilityManager
            .getEnabledAccessibilityServiceList(AccessibilityServiceInfo.FEEDBACK_ALL_MASK)
            .any { service ->
                val serviceInfo = service.resolveInfo.serviceInfo
                serviceInfo.packageName == expectedComponent.packageName &&
                    serviceInfo.name == expectedComponent.className
            }

        promise.resolve(isEnabled)
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
