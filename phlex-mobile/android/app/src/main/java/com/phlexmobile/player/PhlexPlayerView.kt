// android/app/src/main/java/com/phlexmobile/player/PhlexPlayerView.kt
package com.phlexmobile.player

import android.app.PictureInPictureParams
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.os.Build
import android.util.Rational
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.annotations.ReactProp
import com.google.android.exoplayer2.*
import com.google.android.exoplayer2.audio.AudioAttributes
import com.google.android.exoplayer2.audio.AudioSink
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector
import com.google.android.exoplayer2.ui.PlayerView

class PhlexPlayerView(reactContext: ReactApplicationContext) :
    ReactViewManager(reactContext) {

    private var player: ExoPlayer? = null
    private var playerView: PlayerView? = null
    private var trackSelector: DefaultTrackSelector? = null
    private var src: String = ""
    private var autoPlay: Boolean = true
    private var startPosition: Long = 0

    override fun getName(): String = "PhlexPlayerView"

    override fun createViewInstance(reactContext: ThemedReactContext): PlayerView {
        trackSelector = DefaultTrackSelector(reactContext)
        player = ExoPlayer.Builder(reactContext)
            .setTrackSelector(trackSelector!!)
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
                    .setUsage(C.USAGE_MEDIA)
                    .build(),
                true
            )
            .setHandleAudioBecomingNoisy(true)
            .build()

        playerView = PlayerView(reactContext).apply {
            this.player = player
            useController = false
        }

        player?.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                when (playbackState) {
                    Player.STATE_READY -> sendEvent("onPlaybackEvent", Arguments.createMap().apply {
                        putString("event", "ready")
                    })
                    Player.STATE_ENDED -> sendEvent("onPlaybackEvent", Arguments.createMap().apply {
                        putString("event", "ended")
                    })
                }
            }

            override fun onPlayerError(error: PlaybackException) {
                sendEvent("onError", Arguments.createMap().apply {
                    putString("error", error.message)
                })
            }
        })

        return playerView!!
    }

    @ReactProp(name = "src")
    fun setSrc(view: PlayerView, src: String) {
        this.src = src
        if (src.isNotEmpty()) {
            loadVideo(src)
        }
    }

    @ReactProp(name = "autoPlay")
    fun setAutoPlay(view: PlayerView, autoPlay: Boolean) {
        this.autoPlay = autoPlay
    }

    @ReactProp(name = "startPosition")
    fun setStartPosition(view: PlayerView, position: Double) {
        this.startPosition = (position * 1000).toLong()
    }

    private fun loadVideo(url: String) {
        val mediaItem = MediaItem.fromUri(url)
        player?.setMediaItem(mediaItem)
        player?.prepare()

        if (startPosition > 0) {
            player?.seekTo(startPosition)
        }

        if (autoPlay) {
            player?.play()
        }
    }

    @ReactProp(name = "volume")
    fun setVolume(view: PlayerView, volume: Float) {
        player?.volume = volume
    }

    @ReactProp(name = "muted")
    fun setMuted(view: PlayerView, muted: Boolean) {
        player?.volume = if (muted) 0f else player?.volume ?: 1f
    }

    @ReactProp(name = "rate")
    fun setRate(view: PlayerView, rate: Float) {
        player?.setPlaybackSpeed(rate)
    }

    @ReactProp(name = "pictureInPicture")
    fun setPictureInPicture(view: PlayerView, enabled: Boolean) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && enabled) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            (reactApplicationContext.currentActivity as? MainActivity)?.enterPictureInPictureMode(params.build())
        }
    }

    // Exposed methods
    @ReactMethod
    fun play() {
        player?.play()
        sendEvent("onPlaybackEvent", Arguments.createMap().apply {
            putString("event", "play")
        })
    }

    @ReactMethod
    fun pause() {
        player?.pause()
        sendEvent("onPlaybackEvent", Arguments.createMap().apply {
            putString("event", "pause")
        })
    }

    @ReactMethod
    fun seekTo(position: Double) {
        player?.seekTo((position * 1000).toLong())
    }

    @ReactMethod
    fun getCurrentPosition(callback: Callback) {
        callback.invoke(player?.currentPosition?.toDouble()?.div(1000))
    }

    @ReactMethod
    fun getDuration(callback: Callback) {
        callback.invoke(player?.duration?.toDouble()?.div(1000))
    }

    private fun sendEvent(name: String, params: WritableMap) {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(name, params)
    }

    override fun onDropViewInstance(view: PlayerView) {
        super.onDropViewInstance(view)
        player?.release()
        player = null
    }
}
