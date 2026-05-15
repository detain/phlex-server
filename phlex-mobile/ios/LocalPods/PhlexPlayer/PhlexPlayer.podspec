// ios/LocalPods/PhlexPlayer/PhlexPlayer.podspec
Pod::Spec.new do |s|
  s.name         = "PhlexPlayer"
  s.version      = "1.0.0"
  s.summary      = "Native video player for Phlex Mobile"
  s.description  = "AVKit-based video player with HLS support for Phlex Media Server"
  s.homepage     = "https://github.com/phlex-media/phlex-mobile"
  s.license      = "MIT"
  s.author       = { "Phlex" => "contact@phlex.media" }
  s.platform     = :ios, "15.0"
  s.source       = { :path => "." }
  s.source_files = "*.{h,m,swift}"
  s.swift_version = "5.0"
  s.dependency "React-Core"
end
