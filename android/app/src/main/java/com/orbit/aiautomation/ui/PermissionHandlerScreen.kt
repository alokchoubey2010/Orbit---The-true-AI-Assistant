package com.orbit.aiautomation.ui

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

@Composable
fun PermissionHandlerScreen(
    onRequestOverlayPermission: () -> Unit,
    onStartOverlay: () -> Unit
) {
    val context = LocalContext.current
    var accessibilityEnabled by remember { mutableStateOf(isAccessibilityServiceEnabled(context)) }

    LaunchedEffect(Unit) {
        while (true) {
            accessibilityEnabled = isAccessibilityServiceEnabled(context)
            delay(1_000)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = if (accessibilityEnabled) {
                "Accessibility Service enabled"
            } else {
                "Enable Accessibility Service to start AI Automation"
            },
            style = MaterialTheme.typography.titleMedium
        )

        if (!accessibilityEnabled) {
            Button(onClick = {
                context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                })
            }) {
                Text("Open Accessibility Settings")
            }
        }

        Button(onClick = onRequestOverlayPermission, enabled = accessibilityEnabled) {
            Text("Grant Overlay + Show Stop Button")
        }

        Button(onClick = onStartOverlay, enabled = accessibilityEnabled) {
            Text("Show Stop Button")
        }
    }
}

private fun isAccessibilityServiceEnabled(context: Context): Boolean {
    val expectedComponent = ComponentName(context, "com.orbit.aiautomation.MyAutomationService")
    val enabledServices = Settings.Secure.getString(
        context.contentResolver,
        Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
    ) ?: return false

    return enabledServices.split(':').any {
        ComponentName.unflattenFromString(it) == expectedComponent
    }
}
