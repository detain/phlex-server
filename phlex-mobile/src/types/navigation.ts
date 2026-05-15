// src/types/navigation.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// Root Stack
export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  Player: { itemId: string; startPosition?: number };
  Profiles: undefined;
};

// Tab Navigator
export type TabParamList = {
  Home: undefined;
  Library: undefined;
  Search: undefined;
  Downloads: undefined;
  Settings: undefined;
};

// Home Stack
export type HomeStackParamList = {
  HomeMain: undefined;
  MediaDetail: { itemId: string };
  SeasonDetail: { seasonId: string };
};

// Library Stack
export type LibraryStackParamList = {
  LibraryMain: undefined;
  MediaDetail: { itemId: string };
};

// Search Stack
export type SearchStackParamList = {
  SearchMain: undefined;
  MediaDetail: { itemId: string };
};

// Screen props
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type HomeStackScreenProps<T extends keyof HomeStackParamList> =
  NativeStackScreenProps<HomeStackParamList, T>;

export type LibraryStackScreenProps<T extends keyof LibraryStackParamList> =
  NativeStackScreenProps<LibraryStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
