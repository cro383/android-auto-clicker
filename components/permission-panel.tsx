import { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { AutoClickerNative } from '@/lib/auto-clicker-native';

type PermissionState = {
  accessibility: boolean;
  overlay: boolean;
  overlayVisible: boolean;
};

const INITIAL_STATE: PermissionState = {
  accessibility: false,
  overlay: false,
  overlayVisible: false,
};

export function PermissionPanel() {
  const [permissions, setPermissions] = useState(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPermissions = useCallback(async () => {
    if (!AutoClickerNative.isAvailable) {
      setIsLoading(false);
      return;
    }

    try {
      const [accessibility, overlay, overlayVisible] = await Promise.all([
        AutoClickerNative.checkAccessibilityPermission(),
        AutoClickerNative.checkOverlayPermission(),
        AutoClickerNative.checkOverlayVisible(),
      ]);
      setPermissions({ accessibility, overlay, overlayVisible });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPermissions();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshPermissions();
      }
    });

    return () => subscription.remove();
  }, [refreshPermissions]);

  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Android permissions</Text>
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
