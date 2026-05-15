// ios/LocalPods/PhlexPlayer/PhlexPlayerView.swift
import AVKit
import AVFoundation
import React

@objc(PhlexPlayerView)
class PhlexPlayerView: RCTViewManager {
    override func view() -> UIView! {
        return PhlexPlayerViewWrapper()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}

class PhlexPlayerViewWrapper: UIView {
    private var player: AVPlayer?
    private var playerLayer: AVPlayerLayer?
    private var timeObserver: Any?
    private var playerItem: AVPlayerItem?

    // Event emitter
    @objc var onPlaybackEvent: RCTDirectEventBlock?
    @objc var onProgress: RCTDirectEventBlock?
    @objc var onError: RCTDirectEventBlock?

    // Properties
    @objc var src: String = "" {
        didSet { loadVideo() }
    }

    @objc var autoPlay: Bool = true
    @objc var startPosition: Double = 0
    @objc var volume: Float = 1.0 {
        didSet { player?.volume = volume }
    }
    @objc var muted: Bool = false {
        didSet { player?.isMuted = muted }
    }

    override init(frame: CGRect) {
        super.init(frame: frame)
        setupPlayer()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setupPlayer()
    }

    private func setupPlayer() {
        playerLayer = AVPlayerLayer()
        playerLayer?.videoGravity = .resizeAspect
        playerLayer?.frame = bounds
        if let layer = playerLayer {
            layer.addSublayer(layer)
        }
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer?.frame = bounds
    }

    private func loadVideo() {
        guard !src.isEmpty else { return }

        // Clean up previous player
        cleanup()

        // Create asset and player item
        guard let url = URL(string: src) else {
            onError?(["error": "Invalid URL"])
            return
        }

        let asset = AVURLAsset(url: url)
        playerItem = AVPlayerItem(asset: asset)
        player = AVPlayer(playerItem: playerItem)

        playerLayer?.player = player

        // Observe player status
        playerItem?.addObserver(self, forKeyPath: "status", options: [.new], context: nil)

        // Add time observer
        let interval = CMTime(seconds: 1.0, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.onProgress?([
                "currentTime": time.seconds,
                "duration": self?.playerItem?.duration.seconds ?? 0
            ])
        }

        // Seek to start position
        if startPosition > 0 {
            let seekTime = CMTime(seconds: startPosition, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
            player?.seek(to: seekTime)
        }

        if autoPlay {
            player?.play()
        }

        // Observe playback end
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerDidFinishPlaying),
            name: .AVPlayerItemDidPlayToEndTime,
            object: playerItem
        )
    }

    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "status" {
            if playerItem?.status == .readyToPlay {
                onPlaybackEvent?(["event": "ready"])
            } else if playerItem?.status == .failed {
                onError?(["error": playerItem?.error?.localizedDescription ?? "Unknown error"])
            }
        }
    }

    @objc private func playerDidFinishPlaying() {
        onPlaybackEvent?(["event": "ended"])
    }

    // React Native methods
    @objc func play() {
        player?.play()
        onPlaybackEvent?(["event": "play"])
    }

    @objc func pause() {
        player?.pause()
        onPlaybackEvent?(["event": "pause"])
    }

    @objc func seekTo(_ position: Double) {
        let time = CMTime(seconds: position, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        player?.seek(to: time)
    }

    @objc func setVolume(_ volume: Float) {
        player?.volume = volume
    }

    @objc func setMuted(_ muted: Bool) {
        player?.isMuted = muted
    }

    private func cleanup() {
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
        if playerItem != nil {
            playerItem?.removeObserver(self, forKeyPath: "status")
        }
        NotificationCenter.default.removeObserver(self)
        player?.pause()
        player = nil
        playerItem = nil
    }

    deinit {
        cleanup()
    }
}
