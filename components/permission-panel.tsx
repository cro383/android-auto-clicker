import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { AutoClickerNative } from '@/lib/auto-clicker-native';

const PERMISSION_GUIDE_SHOWN_KEY = 'auto-clicker/permission-guide-shown';

type PermissionState = {
  accessibility: boolean;
  overlay: boolean;
  overlayVisible: boolean;
};

type SetupStep = 'accessibility' | 'overlay' | null;

const INITIAL_STATE: PermissionState = {
  accessibility: false,
  overlay: false,
  overlayVisible: false,
};

export function PermissionPanel() {
  const [permissions, setPermissions] = useState(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const setupStepRef = useRef<SetupStep>(null);
  const isHandlingReturnRef = useRef(false);

  const refreshPermissions = useCallback(async () => {
    if (!AutoClickerNative.isAvailable) {
      setIsLoading(false);
      return null;
    }

    try {
      const [accessibility, overlay, overlayVisible] = await Promise.all([
        AutoClickerNative.checkAccessibilityPermission(),
        AutoClickerNative.checkOverlayPermission(),
        AutoClickerNative.checkOverlayVisible(),
      ]);
      const nextPermissions = { accessibility, overlay, overlayVisible };
      setPermissions(nextPermissions);
      return nextPermissions;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openNextPermissionSettings = useCallback((current: PermissionState) => {
    if (!current.accessibility) {
      setupStepRef.current = 'accessibility';
      AutoClickerNative.requestAccessibilityPermission();
      return;
    }

    if (!current.overlay) {
      setupStepRef.current = 'overlay';
      AutoClickerNative.requestOverlayPermission();
      return;
    }

    setupStepRef.current = null;
    Alert.alert('권한 설정 완료', '자동 클릭 실행에 필요한 Android 권한이 모두 허용되었습니다.');
  }, []);

  const startPermissionSetup = useCallback(async () => {
    const current = await refreshPermissions();
    if (current) {
      openNextPermissionSettings(current);
    }
  }, [openNextPermissionSettings, refreshPermissions]);

  const handleReturnFromSettings = useCallback(async () => {
    if (isHandlingReturnRef.current) {
      return;
    }

    isHandlingReturnRef.current = true;
    try {
      const current = await refreshPermissions();
      const step = setupStepRef.current;
      if (!current || step === null) {
        return;
      }

      if (step === 'accessibility' && current.accessibility) {
        openNextPermissionSettings(current);
        return;
      }

      if (step === 'overlay' && current.overlay) {
        openNextPermissionSettings(current);
        return;
      }

      setupStepRef.current = null;
    } finally {
      isHandlingReturnRef.current = false;
    }
  }, [openNextPermissionSettings, refreshPermissions]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void handleReturnFromSettings();
      }
    });

    return () => subscription.remove();
  }, [handleReturnFromSettings]);

  useEffect(() => {
    let cancelled = false;

    const showInitialPermissionGuide = async () => {
      const current = await refreshPermissions();
      if (
        cancelled ||
        !current ||
        (current.accessibility && current.overlay)
      ) {
        return;
      }

      const guideShown = await AsyncStorage.getItem(PERMISSION_GUIDE_SHOWN_KEY);
      if (cancelled || guideShown === 'true') {
        return;
      }

      await AsyncStorage.setItem(PERMISSION_GUIDE_SHOWN_KEY, 'true');
      if (cancelled) {
        return;
      }

      Alert.alert(
        'Android 권한 설정',
        '외부 앱에서 자동 클릭을 사용하려면 접근성 서비스와 다른 앱 위에 표시 권한이 필요합니다.',
        [
          { text: '나중에', style: 'cancel' },
          {
            text: '권한 설정 시작',
            onPress: () => openNextPermissionSettings(current),
          },
        ],
      );
    };

    void showInitialPermissionGuide();

    return () => {
      cancelled = true;
    };
  }, [openNextPermissionSettings, refreshPermissions]);

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Android permissions</Text>
      {!isLoading && (!permissions.accessibility || !permissions.overlay) && (
        <Pressable style={styles.setupButton} onPress={() => void startPermissionSetup()}>
          <Text style={styles.setupButtonText}>권한 설정 시작</Text>
        </Pressable>
      )}
      <PermissionRow
        label="Accessibility service"
        granted={permissions.accessibility}
        isLoading={isLoading}
        onPress={AutoClickerNative.requestAccessibilityPermission}
      />
      <PermissionRow
        label="Display over other apps"
        granted={permissions.overlay}
        isLoading={isLoading}
        onPress={AutoClickerNative.requestOverlayPermission}
      />
      <View style={styles.row}>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>Floating target</Text>
          <Text style={[styles.status, permissions.overlayVisible && styles.granted]}>
            {permissions.overlayVisible ? 'Visible' : 'Hidden'}
          </Text>
        </View>
        <Pressable
          style={[
            styles.button,
            (!permissions.accessibility || !permissions.overlay) && styles.buttonDisabled,
          ]}
          disabled={!permissions.accessibility || !permissions.overlay}
          onPress={() => {
            if (permissions.overlayVisible) {
              AutoClickerNative.hideOverlay();
            } else {
              AutoClickerNative.showOverlay();
            }
            setPermissions((current) => ({
              ...current,
              overlayVisible: !current.overlayVisible,
            }));
          }}>
          <Text style={styles.buttonText}>
            {permissions.overlayVisible ? 'Hide target' : 'Show target'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

type PermissionRowProps = {
  label: string;
  granted: boolean;
  isLoading: boolean;
  onPress(): void;
};

function PermissionRow({ label, granted, isLoading, onPress }: PermissionRowProps) {
  const status = isLoading ? 'Checking' : granted ? 'Granted' : 'Required';

  return (
    <View style={styles.row}>
      <View style={styles.labelGroup}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.status, granted && styles.granted]}>{status}</Text>
      </View>
      <Pressable
        style={[styles.button, (granted || isLoading) && styles.buttonDisabled]}
        disabled={granted || isLoading}
        onPress={onPress}>
        <Text style={styles.buttonText}>Open settings</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#18181b',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  setupButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#7c3aed',
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  labelGroup: {
    flex: 1,
  },
  label: {
    color: '#e4e4e7',
    fontSize: 14,
  },
  status: {
    color: '#f87171',
    fontSize: 12,
    marginTop: 2,
  },
  granted: {
    color: '#4ade80',
  },
  button: {
    minWidth: 112,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: '#2563eb',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});
