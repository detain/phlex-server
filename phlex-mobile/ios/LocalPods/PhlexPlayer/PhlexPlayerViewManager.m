// ios/LocalPods/PhlexPlayer/PhlexPlayerViewManager.m
#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(PhlexPlayerView, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(src, NSString)
RCT_EXPORT_VIEW_PROPERTY(autoPlay, BOOL)
RCT_EXPORT_VIEW_PROPERTY(startPosition, double)
RCT_EXPORT_VIEW_PROPERTY(volume, float)
RCT_EXPORT_VIEW_PROPERTY(muted, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onPlaybackEvent, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onProgress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onError, RCTDirectEventBlock)

RCT_EXTERN_METHOD(play)
RCT_EXTERN_METHOD(pause)
RCT_EXTERN_METHOD(seekTo:(double)position)
RCT_EXTERN_METHOD(setVolume:(float)volume)
RCT_EXTERN_METHOD(setMuted:(BOOL)muted)

@end
