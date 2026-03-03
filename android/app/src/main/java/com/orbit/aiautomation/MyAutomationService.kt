package com.orbit.aiautomation

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch

class MyAutomationService : AccessibilityService() {

    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.i(TAG, "Accessibility service connected")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        serviceScope.launch {
            val root = rootInActiveWindow ?: return@launch
            Log.d(TAG, "Window changed: package=${event.packageName}, class=${event.className}")
            traverseNode(root)
        }
    }

    override fun onInterrupt() {
        Log.w(TAG, "Service interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
    }

    fun traverseNode(node: AccessibilityNodeInfo?) {
        if (node == null) return

        val details = buildString {
            append("text=${node.text}")
            append(", contentDescription=${node.contentDescription}")
            append(", className=${node.className}")
            append(", viewId=${node.viewIdResourceName}")
            append(", clickable=${node.isClickable}")
        }

        Log.d(TAG, details)

        for (index in 0 until node.childCount) {
            traverseNode(node.getChild(index))
        }
    }

    fun performAutoClick(text: String): Boolean {
        val root = rootInActiveWindow ?: return false
        val matchingNodes = root.findAccessibilityNodeInfosByText(text)
            ?.filterNotNull()
            ?.filter { it.isVisibleToUser }
            .orEmpty()

        for (node in matchingNodes) {
            val clickableNode = findFirstClickableParent(node)
            if (clickableNode?.performAction(AccessibilityNodeInfo.ACTION_CLICK) == true) {
                Log.i(TAG, "Clicked node with text=$text")
                return true
            }
        }

        Log.w(TAG, "No clickable node found for text=$text")
        return false
    }

    fun performTap(x: Float, y: Float) {
        val path = Path().apply { moveTo(x, y) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0L, 100L))
            .build()

        dispatchGesture(gesture, null, null)
    }

    private fun findFirstClickableParent(node: AccessibilityNodeInfo?): AccessibilityNodeInfo? {
        var current = node
        while (current != null) {
            if (current.isClickable) return current
            current = current.parent
        }
        return null
    }

    companion object {
        private const val TAG = "MyAutomationService"
    }
}
