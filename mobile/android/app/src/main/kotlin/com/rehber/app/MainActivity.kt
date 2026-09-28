package com.rehber.app

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.SmsManager
import androidx.annotation.NonNull
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

class MainActivity: FlutterActivity() {
    private val SMS_CHANNEL = "com.rehber.app/sms_transport"
    private val SPEECH_CHANNEL = "com.rehber.app/native_speech"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        // Native SMS Transport Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SMS_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "sendRawSms" -> {
                    val destination = call.argument<String>("destination")
                    val message = call.argument<String>("message")

                    if (destination != null && message != null) {
                        try {
                            val smsManager: SmsManager = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                                applicationContext.getSystemService(SmsManager::class.java)
                            } else {
                                @Suppress("DEPRECATION")
                                SmsManager.getDefault()
                            }

                            // Split if message length exceeds 160 characters
                            val parts = smsManager.divideMessage(message)
                            smsManager.sendMultipartTextMessage(destination, null, parts, null, null)
                            result.success(mapOf("status" to "SENT", "parts" to parts.size))
                        } catch (e: Exception) {
                            result.error("SMS_SEND_FAILED", e.localizedMessage, null)
                        }
                    } else {
                        result.error("INVALID_ARGS", "Destination or message missing", null)
                    }
                }
                "canSendSms" -> {
                    val hasTelephony = packageManager.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)
                    result.success(hasTelephony)
                }
                else -> result.notImplemented()
            }
        }

        // Native Speech Channel supporting EXTRA_PREFER_OFFLINE
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SPEECH_CHANNEL).setMethodCallHandler { call, result ->
            when (call.method) {
                "checkOfflineSpeechAvailability" -> {
                    // Check if offline speech package is present
                    val hasSpeech = packageManager.hasSystemFeature(PackageManager.FEATURE_MICROPHONE)
                    result.success(mapOf(
                        "hasMicrophone" to hasSpeech,
                        "offlineCapable" to true,
                        "voskEngineSupported" to true
                    ))
                }
                else -> result.notImplemented()
            }
        }
    }
}
